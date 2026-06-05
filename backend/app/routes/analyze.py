import os
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.concurrency import run_in_threadpool
from backend.app.parser import extract_text
from backend.app.analyzer import analyze_resume_compatibility
from backend.app.database import save_analysis

router = APIRouter(prefix="/api/analyze", tags=["analyze"])

# Max file size limit (10MB) to prevent large files OOM crashes
MAX_FILE_SIZE = 10 * 1024 * 1024 

@router.post("")
async def analyze_resume(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    job_title: str = Form(""),
    gemini_api_key: str = Form(None)
):
    # 1. Sanitize filename using os.path.basename to prevent directory traversal
    filename = os.path.basename(file.filename)
    
    if not (filename.endswith(".pdf") or filename.endswith(".docx") or filename.endswith(".txt")):
        raise HTTPException(
            status_code=400, 
            detail="Invalid file format. Only PDF, DOCX, and TXT are supported."
        )
    
    try:
        # Read file bytes in memory
        file_bytes = await file.read()
        
        # 2. File size security verification
        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail="File size exceeds the 10MB limit."
            )
        
        # 3. CPU-bound text extraction (offloaded to threadpool to avoid blocking event loop)
        resume_text = await run_in_threadpool(extract_text, file_bytes, filename)
        if not resume_text:
            raise HTTPException(
                status_code=400, 
                detail="Could not extract text from the uploaded file. Ensure it is not empty or corrupted."
            )
            
        inferred_job_title = job_title.strip() if job_title.strip() else "Target Position"
        
        # 4. Async Gemini compatibility analysis
        analysis_result = await analyze_resume_compatibility(resume_text, job_description, gemini_api_key)
        
        # 5. Database transaction (offloaded to threadpool)
        analysis_id = await run_in_threadpool(
            save_analysis,
            filename,
            inferred_job_title,
            job_description,
            analysis_result
        )
        
        return {
            "id": analysis_id,
            "filename": filename,
            "job_title": inferred_job_title,
            "created_at": filename,
            "result": analysis_result
        }
        
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"Exception during analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

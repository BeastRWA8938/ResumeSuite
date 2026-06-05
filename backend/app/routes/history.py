from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
from backend.app.database import get_analyses_history, get_analysis, delete_analysis_record

router = APIRouter(prefix="/api/history", tags=["history"])

@router.get("")
async def get_history():
    try:
        # Offload synchronous database call to threadpool to prevent blocking the event loop
        return await run_in_threadpool(get_analyses_history)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")

@router.get("/{analysis_id}")
async def get_analysis_by_id(analysis_id: int):
    # Offload database query to threadpool
    analysis = await run_in_threadpool(get_analysis, analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found.")
    return analysis

@router.delete("/{analysis_id}")
async def delete_analysis(analysis_id: int):
    # Offload deletion transaction to threadpool
    success = await run_in_threadpool(delete_analysis_record, analysis_id)
    if not success:
        raise HTTPException(status_code=404, detail="Analysis record not found.")
    return {"status": "success", "message": f"Record {analysis_id} deleted successfully."}

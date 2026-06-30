from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from uuid import UUID
from typing import List
from pydantic import BaseModel
import json

from app.domain.schemas import AtomicFact, ResumeSynthesisResponse
from app.persistence.db import get_session
from app.persistence.repositories import SQLAtomicFactRepository
from app.persistence.models import AtomicFactTable
from app.infrastructure.services import GeminiResumeSynthesisService

router = APIRouter(prefix="/api/resume", tags=["Resume"])

class ResumeSynthesisRequest(BaseModel):
    selected_fact_ids: List[UUID]
    job_description: str
    company_context: str

@router.post("/synthesize", response_model=ResumeSynthesisResponse)
def synthesize_resume(req: ResumeSynthesisRequest, session: Session = Depends(get_session)):
    """
    Retrieves the selected atomic facts and aggregate skills from SQLite,
    invokes Gemini to tailor/synthesize accomplishments, and organizes skills by relevance.
    """
    if not req.selected_fact_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one achievement must be selected for synthesis."
        )

    # 1. Retrieve the specific selected AtomicFact records
    repo = SQLAtomicFactRepository(session)
    selected_facts = []
    for fid in req.selected_fact_ids:
        fact = repo.get_by_id(fid)
        if fact:
            selected_facts.append(fact)
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Selected atomic fact ID {fid} was not found in the database vault."
            )

    # 2. Gather the complete set of unique skills in the vault
    statement = select(AtomicFactTable)
    all_db_facts = session.exec(statement).all()
    all_skills_set = set()
    for item in all_db_facts:
        if item.skills:
            try:
                skills_list = json.loads(item.skills)
                if isinstance(skills_list, list):
                    for s in skills_list:
                        all_skills_set.add(str(s).strip())
            except Exception:
                continue
    all_skills = list(all_skills_set)

    # 3. Call synthesis service
    service = GeminiResumeSynthesisService()
    try:
        return service.synthesize_resume_content(
            facts=selected_facts,
            all_skills=all_skills,
            job_description=req.job_description,
            company_context=req.company_context
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Resume content synthesis failed: {e}"
        )

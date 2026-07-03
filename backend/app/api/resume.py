from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from uuid import UUID
from typing import List
from pydantic import BaseModel
import json

from app.domain.schemas import AtomicFact, ResumeSynthesisResponse
from app.persistence.db import get_session
from app.persistence.repositories import (
    SQLProfileRepository,
    SQLEducationRepository,
    SQLWorkExperienceRepository,
    SQLProjectRepository,
    SQLHackathonRepository,
    SQLAtomicFactRepository
)
from app.persistence.models import AtomicFactTable
from app.infrastructure.services import GeminiResumeSynthesisService
from app.infrastructure.latex_generation import SimpleLaTeXGenerationService

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


class ResumeGenerateRequest(BaseModel):
    selected_fact_ids: List[UUID]
    synthesized_bullets: dict[UUID, str]
    prioritized_skills: dict[str, List[str]]

class ResumeGenerateResponse(BaseModel):
    latex_code: str

@router.post("/generate", response_model=ResumeGenerateResponse)
def generate_resume_latex(req: ResumeGenerateRequest, session: Session = Depends(get_session)):
    """
    Loads candidate details and compile achievements into a LaTeX source file.
    """
    # 1. Fetch Profile
    profile_repo = SQLProfileRepository(session)
    profile = profile_repo.get()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No candidate profile found. Please initialize Demographics details first."
        )

    # 2. Fetch Education history
    edu_repo = SQLEducationRepository(session)
    education_list = edu_repo.get_by_profile_id(profile.id)

    # 3. Fetch experiences, projects, hackathons
    exp_repo = SQLWorkExperienceRepository(session)
    experiences = exp_repo.get_by_profile_id(profile.id)

    proj_repo = SQLProjectRepository(session)
    projects = proj_repo.get_by_profile_id(profile.id)

    hack_repo = SQLHackathonRepository(session)
    hackathons = hack_repo.get_by_profile_id(profile.id)

    # 4. Fetch selected AtomicFact items
    fact_repo = SQLAtomicFactRepository(session)
    selected_facts = []
    for fid in req.selected_fact_ids:
        fact = fact_repo.get_by_id(fid)
        if fact:
            selected_facts.append(fact)

    # 5. Generate LaTeX
    service = SimpleLaTeXGenerationService()
    try:
        latex_str = service.generate_latex_resume(
            profile=profile,
            education_list=education_list,
            experiences=experiences,
            projects=projects,
            hackathons=hackathons,
            selected_facts=selected_facts,
            synthesized_bullets=req.synthesized_bullets,
            prioritized_skills=req.prioritized_skills
        )
        return ResumeGenerateResponse(latex_code=latex_str)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LaTeX document generation failed: {e}"
        )

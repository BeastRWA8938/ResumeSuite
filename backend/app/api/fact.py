from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel

from app.domain.schemas import AtomicFact, AtomicFactCreate, AtomicFactMerge, FactRankResult
from app.persistence.db import get_session
from app.persistence.repositories import SQLAtomicFactRepository
from app.infrastructure.services import GeminiFactExtractionService, GeminiRelevanceRankingService

router = APIRouter(prefix="/api/fact", tags=["Atomic Fact"])

class ExtractionRequest(BaseModel):
    raw_description: str
    existing_facts: List[AtomicFact] = []

@router.post("/extract", response_model=List[AtomicFactMerge])
def extract_atomic_facts(req: ExtractionRequest):
    """Decomposes a raw unstructured text paragraph into multiple Atomic Facts, matching against existing records to prevent duplicates."""
    service = GeminiFactExtractionService()
    try:
        return service.extract_facts(req.raw_description, req.existing_facts)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fact extraction failed: {e}"
        )

@router.post("", response_model=AtomicFact, status_code=status.HTTP_201_CREATED)
def create_atomic_fact(fact_in: AtomicFactCreate, session: Session = Depends(get_session)):
    """Saves a new verified atomic fact inside the database vault."""
    repo = SQLAtomicFactRepository(session)
    return repo.save(fact_in)

@router.get("/work-experience/{id}", response_model=List[AtomicFact])
def get_facts_by_work_experience(id: UUID, session: Session = Depends(get_session)):
    """Retrieves all atomic facts linked to a work experience record."""
    repo = SQLAtomicFactRepository(session)
    return repo.get_by_work_experience(id)

@router.get("/project/{id}", response_model=List[AtomicFact])
def get_facts_by_project(id: UUID, session: Session = Depends(get_session)):
    """Retrieves all atomic facts linked to a project record."""
    repo = SQLAtomicFactRepository(session)
    return repo.get_by_project(id)

@router.get("/hackathon/{id}", response_model=List[AtomicFact])
def get_facts_by_hackathon(id: UUID, session: Session = Depends(get_session)):
    """Retrieves all atomic facts linked to a hackathon record."""
    repo = SQLAtomicFactRepository(session)
    return repo.get_by_hackathon(id)

@router.put("/{id}", response_model=AtomicFact)
def update_atomic_fact(id: UUID, fact_in: AtomicFactCreate, session: Session = Depends(get_session)):
    """Updates an existing atomic fact entry by ID. Raises 404 if not found."""
    repo = SQLAtomicFactRepository(session)
    updated = repo.update(id, fact_in)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Atomic fact not found"
        )
    return updated

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_atomic_fact(id: UUID, session: Session = Depends(get_session)):
    """Deletes an atomic fact record by ID. Raises 404 if not found."""
    repo = SQLAtomicFactRepository(session)
    deleted = repo.delete(id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Atomic fact not found"
        )
    return {"success": True, "detail": "Atomic fact deleted"}


class MergeRequest(BaseModel):
    facts: List[AtomicFactMerge]
    parent_id: UUID
    parent_type: str

@router.post("/merge", response_model=List[AtomicFact])
def merge_atomic_facts(req: MergeRequest, session: Session = Depends(get_session)):
    """Atomically updates and inserts verified facts into the SQLite database vault."""
    repo = SQLAtomicFactRepository(session)
    try:
        return repo.merge_facts(req.facts, req.parent_id, req.parent_type)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fact merge operations failed: {e}"
        )


class RankRequest(BaseModel):
    facts: List[AtomicFact]
    job_description: str
    company_context: Optional[str] = None

@router.post("/rank", response_model=List[FactRankResult])
def rank_atomic_facts(req: RankRequest):
    """Calculates semantic similarity scores for all candidate facts matching a target Job Description."""
    service = GeminiRelevanceRankingService()
    try:
        return service.rank_facts(req.facts, req.job_description, req.company_context)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Relevance ranking failed: {e}"
        )



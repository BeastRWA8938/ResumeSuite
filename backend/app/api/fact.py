from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from uuid import UUID
from typing import List
from pydantic import BaseModel

from app.domain.schemas import AtomicFact, AtomicFactCreate
from app.persistence.db import get_session
from app.persistence.repositories import SQLAtomicFactRepository
from app.infrastructure.services import GeminiFactExtractionService

router = APIRouter(prefix="/api/fact", tags=["Atomic Fact"])

class ExtractionRequest(BaseModel):
    raw_description: str

@router.post("/extract", response_model=List[AtomicFactCreate])
def extract_atomic_facts(req: ExtractionRequest):
    """Decomposes a raw unstructured text paragraph into multiple Atomic Facts using Gemini AI."""
    service = GeminiFactExtractionService()
    try:
        return service.extract_facts(req.raw_description)
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

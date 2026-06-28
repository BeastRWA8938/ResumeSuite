from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from uuid import UUID
from typing import List
from app.domain.schemas import Education, EducationCreate
from app.persistence.db import get_session
from app.persistence.repositories import SQLEducationRepository

router = APIRouter(prefix="/api/education", tags=["Education"])

@router.post("", response_model=Education, status_code=status.HTTP_201_CREATED)
def create_education(edu_in: EducationCreate, session: Session = Depends(get_session)):
    """Creates a new education milestone record."""
    repo = SQLEducationRepository(session)
    return repo.save(edu_in)

@router.get("/profile/{profile_id}", response_model=List[Education])
def get_education_by_profile(profile_id: UUID, session: Session = Depends(get_session)):
    """Retrieves all education milestones for a candidate's profile ID."""
    repo = SQLEducationRepository(session)
    return repo.get_by_profile_id(profile_id)

@router.put("/{id}", response_model=Education)
def update_education(id: UUID, edu_in: EducationCreate, session: Session = Depends(get_session)):
    """Updates an education milestone record. Raises 404 if not found."""
    repo = SQLEducationRepository(session)
    updated = repo.update(id, edu_in)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Education record not found"
        )
    return updated

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_education(id: UUID, session: Session = Depends(get_session)):
    """Deletes an education milestone record. Raises 404 if not found."""
    repo = SQLEducationRepository(session)
    deleted = repo.delete(id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Education record not found"
        )
    return {"success": True, "detail": "Education record deleted"}

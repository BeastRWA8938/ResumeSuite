from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from uuid import UUID
from typing import List
from app.domain.schemas import WorkExperience, WorkExperienceCreate
from app.persistence.db import get_session
from app.persistence.repositories import SQLWorkExperienceRepository

router = APIRouter(prefix="/api/work-experience", tags=["Work Experience"])

@router.post("", response_model=WorkExperience, status_code=status.HTTP_201_CREATED)
def create_work_experience(exp_in: WorkExperienceCreate, session: Session = Depends(get_session)):
    """Creates a new professional work experience record."""
    repo = SQLWorkExperienceRepository(session)
    return repo.save(exp_in)

@router.get("/profile/{profile_id}", response_model=List[WorkExperience])
def get_work_experience_by_profile(profile_id: UUID, session: Session = Depends(get_session)):
    """Retrieves all professional experience records linked to the profile ID."""
    repo = SQLWorkExperienceRepository(session)
    return repo.get_by_profile_id(profile_id)

@router.put("/{id}", response_model=WorkExperience)
def update_work_experience(id: UUID, exp_in: WorkExperienceCreate, session: Session = Depends(get_session)):
    """Updates an existing professional experience record by ID. Raises 404 if not found."""
    repo = SQLWorkExperienceRepository(session)
    updated = repo.update(id, exp_in)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work experience record not found"
        )
    return updated

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_work_experience(id: UUID, session: Session = Depends(get_session)):
    """Deletes a professional experience record by ID. Raises 404 if not found."""
    repo = SQLWorkExperienceRepository(session)
    deleted = repo.delete(id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work experience record not found"
        )
    return {"success": True, "detail": "Work experience record deleted"}

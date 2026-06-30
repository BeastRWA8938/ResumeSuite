from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from uuid import UUID
from typing import List
from app.domain.schemas import Project, ProjectCreate
from app.persistence.db import get_session
from app.persistence.repositories import SQLProjectRepository

router = APIRouter(prefix="/api/project", tags=["Project"])

@router.post("", response_model=Project, status_code=status.HTTP_201_CREATED)
def create_project(proj_in: ProjectCreate, session: Session = Depends(get_session)):
    """Creates a new project record."""
    repo = SQLProjectRepository(session)
    return repo.save(proj_in)

@router.get("/profile/{profile_id}", response_model=List[Project])
def get_projects_by_profile(profile_id: UUID, session: Session = Depends(get_session)):
    """Retrieves all project records linked to the profile ID."""
    repo = SQLProjectRepository(session)
    return repo.get_by_profile_id(profile_id)

@router.put("/{id}", response_model=Project)
def update_project(id: UUID, proj_in: ProjectCreate, session: Session = Depends(get_session)):
    """Updates an existing project record by ID. Raises 404 if not found."""
    repo = SQLProjectRepository(session)
    updated = repo.update(id, proj_in)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project record not found"
        )
    return updated

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_project(id: UUID, session: Session = Depends(get_session)):
    """Deletes a project record by ID. Raises 404 if not found."""
    repo = SQLProjectRepository(session)
    deleted = repo.delete(id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project record not found"
        )
    return {"success": True, "detail": "Project record deleted"}

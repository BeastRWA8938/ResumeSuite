from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from uuid import UUID
from typing import List
from app.domain.schemas import Hackathon, HackathonCreate
from app.persistence.db import get_session
from app.persistence.repositories import SQLHackathonRepository

router = APIRouter(prefix="/api/hackathon", tags=["Hackathon"])

@router.post("", response_model=Hackathon, status_code=status.HTTP_201_CREATED)
def create_hackathon(hack_in: HackathonCreate, session: Session = Depends(get_session)):
    """Creates a new hackathon/competition record."""
    repo = SQLHackathonRepository(session)
    return repo.save(hack_in)

@router.get("/profile/{profile_id}", response_model=List[Hackathon])
def get_hackathons_by_profile(profile_id: UUID, session: Session = Depends(get_session)):
    """Retrieves all hackathon/competition records linked to the profile ID."""
    repo = SQLHackathonRepository(session)
    return repo.get_by_profile_id(profile_id)

@router.put("/{id}", response_model=Hackathon)
def update_hackathon(id: UUID, hack_in: HackathonCreate, session: Session = Depends(get_session)):
    """Updates an existing hackathon record by ID. Raises 404 if not found."""
    repo = SQLHackathonRepository(session)
    updated = repo.update(id, hack_in)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hackathon record not found"
        )
    return updated

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_hackathon(id: UUID, session: Session = Depends(get_session)):
    """Deletes a hackathon record by ID. Raises 404 if not found."""
    repo = SQLHackathonRepository(session)
    deleted = repo.delete(id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hackathon record not found"
        )
    return {"success": True, "detail": "Hackathon record deleted"}

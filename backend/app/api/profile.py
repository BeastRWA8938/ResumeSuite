from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from app.domain.schemas import Profile, ProfileCreate
from app.persistence.db import get_session
from app.persistence.repositories import SQLProfileRepository

router = APIRouter(prefix="/api/profile", tags=["Profile"])

@router.get("", response_model=Profile)
def get_profile(session: Session = Depends(get_session)):
    """Retrieves the active user profile. Raises 404 if not yet created."""
    repo = SQLProfileRepository(session)
    profile = repo.get()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    return profile

@router.post("", response_model=Profile, status_code=status.HTTP_201_CREATED)
def save_profile(profile_in: ProfileCreate, session: Session = Depends(get_session)):
    """Saves or updates the user profile (single-user constraint)."""
    repo = SQLProfileRepository(session)
    return repo.save(profile_in)

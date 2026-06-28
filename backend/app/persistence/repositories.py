from sqlmodel import Session, select
from typing import Optional, List
from uuid import UUID
from app.domain.repositories import ProfileRepository, EducationRepository
from app.domain.schemas import Profile, ProfileCreate, Education, EducationCreate
from app.persistence.models import ProfileTable, EducationTable

class SQLProfileRepository(ProfileRepository):
    """SQLModel concrete implementation of ProfileRepository."""

    def __init__(self, session: Session):
        self.session = session

    def get(self) -> Optional[Profile]:
        """Retrieves the single user profile (single-user design)."""
        statement = select(ProfileTable)
        db_profile = self.session.exec(statement).first()
        if db_profile:
            return Profile.model_validate(db_profile)
        return None

    def save(self, profile: ProfileCreate) -> Profile:
        """Saves a new user profile or updates the existing one (single-user constraint)."""
        statement = select(ProfileTable)
        db_profile = self.session.exec(statement).first()

        if db_profile:
            # Update existing profile fields
            update_data = profile.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_profile, key, value)
            self.session.add(db_profile)
        else:
            # Create a brand new profile
            db_profile = ProfileTable(**profile.model_dump())
            self.session.add(db_profile)

        self.session.commit()
        self.session.refresh(db_profile)
        return Profile.model_validate(db_profile)


class SQLEducationRepository(EducationRepository):
    """SQLModel concrete implementation of EducationRepository."""

    def __init__(self, session: Session):
        self.session = session

    def save(self, edu: EducationCreate) -> Education:
        """Persists a new education entry in SQLite."""
        db_edu = EducationTable(**edu.model_dump())
        self.session.add(db_edu)
        self.session.commit()
        self.session.refresh(db_edu)
        return Education.model_validate(db_edu)

    def get_by_id(self, id: UUID) -> Optional[Education]:
        """Retrieves an education entry by ID."""
        db_edu = self.session.get(EducationTable, id)
        if db_edu:
            return Education.model_validate(db_edu)
        return None

    def get_by_profile_id(self, profile_id: UUID) -> List[Education]:
        """Retrieves all education entries linked to the profile ID, ordered chronologically."""
        statement = select(EducationTable).where(EducationTable.profile_id == profile_id)
        db_edus = self.session.exec(statement).all()
        return [Education.model_validate(item) for item in db_edus]

    def update(self, id: UUID, edu: EducationCreate) -> Optional[Education]:
        """Updates an existing education entry by ID."""
        db_edu = self.session.get(EducationTable, id)
        if not db_edu:
            return None

        update_data = edu.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_edu, key, value)
        
        self.session.add(db_edu)
        self.session.commit()
        self.session.refresh(db_edu)
        return Education.model_validate(db_edu)

    def delete(self, id: UUID) -> bool:
        """Deletes an education entry by ID."""
        db_edu = self.session.get(EducationTable, id)
        if not db_edu:
            return False
        
        self.session.delete(db_edu)
        self.session.commit()
        return True

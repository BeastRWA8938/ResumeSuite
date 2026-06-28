from abc import ABC, abstractmethod
from typing import Optional, List
from uuid import UUID
from app.domain.schemas import Profile, ProfileCreate, Education, EducationCreate

class ProfileRepository(ABC):
    """Abstract Interface for managing User Profile persistence."""

    @abstractmethod
    def get(self) -> Optional[Profile]:
        """Retrieves the active user profile, if it exists."""
        pass

    @abstractmethod
    def save(self, profile: ProfileCreate) -> Profile:
        """Saves or updates the user profile, returning the saved entity."""
        pass


class EducationRepository(ABC):
    """Abstract Interface for managing Education history persistence."""

    @abstractmethod
    def save(self, edu: EducationCreate) -> Education:
        """Saves a new education entry and returns the persisted entity."""
        pass

    @abstractmethod
    def get_by_id(self, id: UUID) -> Optional[Education]:
        """Retrieves an education entry by its unique ID."""
        pass

    @abstractmethod
    def get_by_profile_id(self, profile_id: UUID) -> List[Education]:
        """Retrieves all education entries associated with a user profile ID."""
        pass

    @abstractmethod
    def update(self, id: UUID, edu: EducationCreate) -> Optional[Education]:
        """Updates an existing education entry and returns the updated entity."""
        pass

    @abstractmethod
    def delete(self, id: UUID) -> bool:
        """Deletes an education entry by ID. Returns True if deleted, False otherwise."""
        pass

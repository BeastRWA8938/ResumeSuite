from abc import ABC, abstractmethod
from typing import Optional, List
from uuid import UUID
from app.domain.schemas import (
    Profile, ProfileCreate, 
    Education, EducationCreate,
    WorkExperience, WorkExperienceCreate,
    Project, ProjectCreate,
    Hackathon, HackathonCreate
)

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


class WorkExperienceRepository(ABC):
    """Abstract Interface for managing candidate professional experiences."""

    @abstractmethod
    def save(self, exp: WorkExperienceCreate) -> WorkExperience:
        """Saves a new work experience entry and returns the persisted entity."""
        pass

    @abstractmethod
    def get_by_id(self, id: UUID) -> Optional[WorkExperience]:
        """Retrieves a professional experience entry by ID."""
        pass

    @abstractmethod
    def get_by_profile_id(self, profile_id: UUID) -> List[WorkExperience]:
        """Retrieves all work experiences associated with a user profile ID."""
        pass

    @abstractmethod
    def update(self, id: UUID, exp: WorkExperienceCreate) -> Optional[WorkExperience]:
        """Updates an existing professional experience entry and returns the updated entity."""
        pass

    @abstractmethod
    def delete(self, id: UUID) -> bool:
        """Deletes an experience record by ID. Returns True if deleted, False otherwise."""
        pass


class ProjectRepository(ABC):
    """Abstract Interface for managing projects history persistence."""

    @abstractmethod
    def save(self, proj: ProjectCreate) -> Project:
        """Saves a new project entry and returns the persisted entity."""
        pass

    @abstractmethod
    def get_by_id(self, id: UUID) -> Optional[Project]:
        """Retrieves a project entry by ID."""
        pass

    @abstractmethod
    def get_by_profile_id(self, profile_id: UUID) -> List[Project]:
        """Retrieves all projects associated with a user profile ID."""
        pass

    @abstractmethod
    def update(self, id: UUID, proj: ProjectCreate) -> Optional[Project]:
        """Updates an existing project entry and returns the updated entity."""
        pass

    @abstractmethod
    def delete(self, id: UUID) -> bool:
        """Deletes a project record by ID. Returns True if deleted, False otherwise."""
        pass


class HackathonRepository(ABC):
    """Abstract Interface for managing hackathons and competitions persistence."""

    @abstractmethod
    def save(self, hack: HackathonCreate) -> Hackathon:
        """Saves a new hackathon entry and returns the persisted entity."""
        pass

    @abstractmethod
    def get_by_id(self, id: UUID) -> Optional[Hackathon]:
        """Retrieves a hackathon entry by ID."""
        pass

    @abstractmethod
    def get_by_profile_id(self, profile_id: UUID) -> List[Hackathon]:
        """Retrieves all hackathons associated with a user profile ID."""
        pass

    @abstractmethod
    def update(self, id: UUID, hack: HackathonCreate) -> Optional[Hackathon]:
        """Updates an existing hackathon entry and returns the updated entity."""
        pass

    @abstractmethod
    def delete(self, id: UUID) -> bool:
        """Deletes a hackathon record by ID. Returns True if deleted, False otherwise."""
        pass

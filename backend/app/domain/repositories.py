from abc import ABC, abstractmethod
from typing import Optional, List
from uuid import UUID
from app.domain.schemas import (
    Profile, ProfileCreate, 
    Education, EducationCreate,
    WorkExperience, WorkExperienceCreate,
    Project, ProjectCreate,
    Hackathon, HackathonCreate,
    AtomicFact, AtomicFactCreate, AtomicFactMerge,
    HistoryEntry, HistoryEntryCreate
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


class AtomicFactRepository(ABC):
    """Abstract Interface for managing Atomic Facts persistence."""

    @abstractmethod
    def save(self, fact: AtomicFactCreate) -> AtomicFact:
        """Saves a new atomic fact entry and returns the persisted entity."""
        pass

    @abstractmethod
    def get_by_id(self, id: UUID) -> Optional[AtomicFact]:
        """Retrieves an atomic fact entry by ID."""
        pass

    @abstractmethod
    def get_by_work_experience(self, exp_id: UUID) -> List[AtomicFact]:
        """Retrieves all atomic facts associated with a work experience ID."""
        pass

    @abstractmethod
    def get_by_project(self, project_id: UUID) -> List[AtomicFact]:
        """Retrieves all atomic facts associated with a project ID."""
        pass

    @abstractmethod
    def get_by_hackathon(self, hackathon_id: UUID) -> List[AtomicFact]:
        """Retrieves all atomic facts associated with a hackathon ID."""
        pass

    @abstractmethod
    def update(self, id: UUID, fact: AtomicFactCreate) -> Optional[AtomicFact]:
        """Updates an existing atomic fact entry and returns the updated entity."""
        pass

    @abstractmethod
    def delete(self, id: UUID) -> bool:
        """Deletes an atomic fact record by ID. Returns True if deleted, False otherwise."""
        pass

    @abstractmethod
    def merge_facts(self, facts: List[AtomicFactMerge], parent_id: UUID, parent_type: str) -> List[AtomicFact]:
        """
        Processes a checklist of new and updated facts, merging them into SQLite.
        parent_type must be one of: 'work_experience', 'project', 'hackathon'.
        """
        pass


class HistoryRepository(ABC):
    """Abstract Interface for managing Tailoring Session Generation History Logs."""

    @abstractmethod
    def save(self, entry: HistoryEntryCreate) -> HistoryEntry:
        """Saves a new resume generation history log entry."""
        pass

    @abstractmethod
    def get_all(self) -> List[HistoryEntry]:
        """Retrieves all historical generation logs, ordered chronologically descending."""
        pass



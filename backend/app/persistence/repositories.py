from sqlmodel import Session, select
from typing import Optional, List
from uuid import UUID
from app.domain.repositories import (
    ProfileRepository, EducationRepository, 
    WorkExperienceRepository, ProjectRepository, HackathonRepository,
    AtomicFactRepository, HistoryRepository
)
from app.domain.schemas import (
    Profile, ProfileCreate, Education, EducationCreate,
    WorkExperience, WorkExperienceCreate,
    Project, ProjectCreate,
    Hackathon, HackathonCreate,
    AtomicFact, AtomicFactCreate, AtomicFactMerge,
    HistoryEntry, HistoryEntryCreate
)
from app.persistence.models import (
    ProfileTable, EducationTable,
    WorkExperienceTable, ProjectTable, HackathonTable,
    AtomicFactTable, HistoryTable
)

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


class SQLWorkExperienceRepository(WorkExperienceRepository):
    """SQLModel concrete implementation of WorkExperienceRepository."""

    def __init__(self, session: Session):
        self.session = session

    def save(self, exp: WorkExperienceCreate) -> WorkExperience:
        """Persists a new work experience entry."""
        db_exp = WorkExperienceTable(**exp.model_dump())
        self.session.add(db_exp)
        self.session.commit()
        self.session.refresh(db_exp)
        return WorkExperience.model_validate(db_exp)

    def get_by_id(self, id: UUID) -> Optional[WorkExperience]:
        """Retrieves a work experience entry by ID."""
        db_exp = self.session.get(WorkExperienceTable, id)
        if db_exp:
            return WorkExperience.model_validate(db_exp)
        return None

    def get_by_profile_id(self, profile_id: UUID) -> List[WorkExperience]:
        """Retrieves all work experience entries linked to the profile ID."""
        statement = select(WorkExperienceTable).where(WorkExperienceTable.profile_id == profile_id)
        db_exps = self.session.exec(statement).all()
        return [WorkExperience.model_validate(item) for item in db_exps]

    def update(self, id: UUID, exp: WorkExperienceCreate) -> Optional[WorkExperience]:
        """Updates an existing work experience entry by ID."""
        db_exp = self.session.get(WorkExperienceTable, id)
        if not db_exp:
            return None

        update_data = exp.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_exp, key, value)
        
        self.session.add(db_exp)
        self.session.commit()
        self.session.refresh(db_exp)
        return WorkExperience.model_validate(db_exp)

    def delete(self, id: UUID) -> bool:
        """Deletes a work experience entry by ID."""
        db_exp = self.session.get(WorkExperienceTable, id)
        if not db_exp:
            return False
        
        self.session.delete(db_exp)
        self.session.commit()
        return True


class SQLProjectRepository(ProjectRepository):
    """SQLModel concrete implementation of ProjectRepository."""

    def __init__(self, session: Session):
        self.session = session

    def save(self, proj: ProjectCreate) -> Project:
        """Persists a new project entry."""
        db_proj = ProjectTable(**proj.model_dump())
        self.session.add(db_proj)
        self.session.commit()
        self.session.refresh(db_proj)
        return Project.model_validate(db_proj)

    def get_by_id(self, id: UUID) -> Optional[Project]:
        """Retrieves a project entry by ID."""
        db_proj = self.session.get(ProjectTable, id)
        if db_proj:
            return Project.model_validate(db_proj)
        return None

    def get_by_profile_id(self, profile_id: UUID) -> List[Project]:
        """Retrieves all projects linked to the profile ID."""
        statement = select(ProjectTable).where(ProjectTable.profile_id == profile_id)
        db_projs = self.session.exec(statement).all()
        return [Project.model_validate(item) for item in db_projs]

    def update(self, id: UUID, proj: ProjectCreate) -> Optional[Project]:
        """Updates an existing project entry by ID."""
        db_proj = self.session.get(ProjectTable, id)
        if not db_proj:
            return None

        update_data = proj.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_proj, key, value)
        
        self.session.add(db_proj)
        self.session.commit()
        self.session.refresh(db_proj)
        return Project.model_validate(db_proj)

    def delete(self, id: UUID) -> bool:
        """Deletes a project entry by ID."""
        db_proj = self.session.get(ProjectTable, id)
        if not db_proj:
            return False
        
        self.session.delete(db_proj)
        self.session.commit()
        return True


class SQLHackathonRepository(HackathonRepository):
    """SQLModel concrete implementation of HackathonRepository."""

    def __init__(self, session: Session):
        self.session = session

    def save(self, hack: HackathonCreate) -> Hackathon:
        """Persists a new hackathon entry."""
        db_hack = HackathonTable(**hack.model_dump())
        self.session.add(db_hack)
        self.session.commit()
        self.session.refresh(db_hack)
        return Hackathon.model_validate(db_hack)

    def get_by_id(self, id: UUID) -> Optional[Hackathon]:
        """Retrieves a hackathon entry by ID."""
        db_hack = self.session.get(HackathonTable, id)
        if db_hack:
            return Hackathon.model_validate(db_hack)
        return None

    def get_by_profile_id(self, profile_id: UUID) -> List[Hackathon]:
        """Retrieves all hackathons linked to the profile ID."""
        statement = select(HackathonTable).where(HackathonTable.profile_id == profile_id)
        db_hacks = self.session.exec(statement).all()
        return [Hackathon.model_validate(item) for item in db_hacks]

    def update(self, id: UUID, hack: HackathonCreate) -> Optional[Hackathon]:
        """Updates an existing hackathon entry by ID."""
        db_hack = self.session.get(HackathonTable, id)
        if not db_hack:
            return None

        update_data = hack.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_hack, key, value)
        
        self.session.add(db_hack)
        self.session.commit()
        self.session.refresh(db_hack)
        return Hackathon.model_validate(db_hack)

    def delete(self, id: UUID) -> bool:
        """Deletes a hackathon entry by ID."""
        db_hack = self.session.get(HackathonTable, id)
        if not db_hack:
            return False
        
        self.session.delete(db_hack)
        self.session.commit()
        return True


import json

class SQLAtomicFactRepository(AtomicFactRepository):
    """SQLModel concrete implementation of AtomicFactRepository."""

    def __init__(self, session: Session):
        self.session = session

    def _to_schema(self, row: AtomicFactTable) -> AtomicFact:
        """Converts an AtomicFactTable db row to an AtomicFact Pydantic schema."""
        try:
            skills = json.loads(row.skills)
            if not isinstance(skills, list):
                skills = []
        except Exception:
            skills = []
        return AtomicFact(
            id=row.id,
            action=row.action,
            metric_result=row.metric_result,
            skills=skills,
            work_experience_id=row.work_experience_id,
            project_id=row.project_id,
            hackathon_id=row.hackathon_id
        )

    def save(self, fact: AtomicFactCreate) -> AtomicFact:
        """Saves a new atomic fact entry and returns the persisted entity."""
        db_fact = AtomicFactTable(
            action=fact.action,
            metric_result=fact.metric_result,
            skills=json.dumps(fact.skills),
            work_experience_id=fact.work_experience_id,
            project_id=fact.project_id,
            hackathon_id=fact.hackathon_id
        )
        self.session.add(db_fact)
        self.session.commit()
        self.session.refresh(db_fact)
        return self._to_schema(db_fact)

    def get_by_id(self, id: UUID) -> Optional[AtomicFact]:
        """Retrieves an atomic fact entry by ID."""
        db_fact = self.session.get(AtomicFactTable, id)
        if not db_fact:
            return None
        return self._to_schema(db_fact)

    def get_by_work_experience(self, exp_id: UUID) -> List[AtomicFact]:
        """Retrieves all atomic facts associated with a work experience ID."""
        statement = select(AtomicFactTable).where(AtomicFactTable.work_experience_id == exp_id)
        db_facts = self.session.exec(statement).all()
        return [self._to_schema(item) for item in db_facts]

    def get_by_project(self, project_id: UUID) -> List[AtomicFact]:
        """Retrieves all atomic facts associated with a project ID."""
        statement = select(AtomicFactTable).where(AtomicFactTable.project_id == project_id)
        db_facts = self.session.exec(statement).all()
        return [self._to_schema(item) for item in db_facts]

    def get_by_hackathon(self, hackathon_id: UUID) -> List[AtomicFact]:
        """Retrieves all atomic facts associated with a hackathon ID."""
        statement = select(AtomicFactTable).where(AtomicFactTable.hackathon_id == hackathon_id)
        db_facts = self.session.exec(statement).all()
        return [self._to_schema(item) for item in db_facts]

    def update(self, id: UUID, fact: AtomicFactCreate) -> Optional[AtomicFact]:
        """Updates an existing atomic fact entry and returns the updated entity."""
        db_fact = self.session.get(AtomicFactTable, id)
        if not db_fact:
            return None

        db_fact.action = fact.action
        db_fact.metric_result = fact.metric_result
        db_fact.skills = json.dumps(fact.skills)
        db_fact.work_experience_id = fact.work_experience_id
        db_fact.project_id = fact.project_id
        db_fact.hackathon_id = fact.hackathon_id
        
        self.session.add(db_fact)
        self.session.commit()
        self.session.refresh(db_fact)
        return self._to_schema(db_fact)

    def delete(self, id: UUID) -> bool:
        """Deletes an atomic fact record by ID."""
        db_fact = self.session.get(AtomicFactTable, id)
        if not db_fact:
            return False
        
        self.session.delete(db_fact)
        self.session.commit()
        return True

    def merge_facts(self, facts: List[AtomicFactMerge], parent_id: UUID, parent_type: str) -> List[AtomicFact]:
        """
        Processes a checklist of new and updated facts, merging them into SQLite.
        parent_type must be one of: 'work_experience', 'project', 'hackathon'.
        """
        clean_parent_type = parent_type.replace("-", "_").strip().lower()
        allowed_types = ["work_experience", "project", "hackathon"]
        if clean_parent_type not in allowed_types:
            raise ValueError(f"Invalid parent_type '{parent_type}'. Must be one of {allowed_types}")

        fk_field = f"{clean_parent_type}_id"
        merged_entities = []

        for fact in facts:
            if fact.status == "update" and fact.id:
                # Attempt to retrieve existing record
                db_fact = self.session.get(AtomicFactTable, fact.id)
                if db_fact:
                    db_fact.action = fact.action
                    db_fact.metric_result = fact.metric_result
                    db_fact.skills = json.dumps(fact.skills)
                    setattr(db_fact, fk_field, parent_id)
                    self.session.add(db_fact)
                    merged_entities.append(db_fact)
                    continue

            # Default fallback for status == "new" or missing update row
            db_fact = AtomicFactTable(
                action=fact.action,
                metric_result=fact.metric_result,
                skills=json.dumps(fact.skills),
                **{fk_field: parent_id}
            )
            self.session.add(db_fact)
            merged_entities.append(db_fact)

        self.session.commit()
        # Refresh and map entities to schemas
        for entity in merged_entities:
            self.session.refresh(entity)

        return [self._to_schema(item) for item in merged_entities]


class SQLHistoryRepository(HistoryRepository):
    """SQLModel concrete implementation of HistoryRepository."""

    def __init__(self, session: Session):
        self.session = session

    def _to_schema(self, db_history: HistoryTable) -> HistoryEntry:
        keywords = []
        if db_history.matched_keywords:
            try:
                keywords = json.loads(db_history.matched_keywords)
            except Exception:
                keywords = []
        return HistoryEntry(
            id=db_history.id,
            company_name=db_history.company_name,
            job_role=db_history.job_role,
            timestamp=db_history.timestamp,
            file_path=db_history.file_path,
            matched_keywords=keywords
        )

    def save(self, entry: HistoryEntryCreate) -> HistoryEntry:
        """Persists a new tailoring history entry in SQLite."""
        db_history = HistoryTable(
            company_name=entry.company_name,
            job_role=entry.job_role,
            timestamp=entry.timestamp,
            file_path=entry.file_path,
            matched_keywords=json.dumps(entry.matched_keywords)
        )
        self.session.add(db_history)
        self.session.commit()
        self.session.refresh(db_history)
        return self._to_schema(db_history)

    def get_all(self) -> List[HistoryEntry]:
        """Retrieves all history logs ordered chronologically descending (latest first)."""
        statement = select(HistoryTable).order_by(HistoryTable.id.desc())
        db_entries = self.session.exec(statement).all()
        return [self._to_schema(item) for item in db_entries]



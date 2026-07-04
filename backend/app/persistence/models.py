from sqlmodel import SQLModel, Field
from uuid import UUID
from typing import Optional
from app.core.uuid import generate_uuid7

class ProfileTable(SQLModel, table=True):
    """Database table definition for User Profile."""
    __tablename__ = "profiles"

    id: UUID = Field(default_factory=generate_uuid7, primary_key=True)
    name: str
    email: str
    phone: str
    location: str
    website: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None

class EducationTable(SQLModel, table=True):
    """Database table definition for Academic Education history."""
    __tablename__ = "education"

    id: UUID = Field(default_factory=generate_uuid7, primary_key=True)
    institution: str
    location: str
    degree: str
    major: str
    start_date: str
    graduation_date: str
    gpa: Optional[str] = None
    
    # Foreign key referencing profiles.id
    profile_id: UUID = Field(foreign_key="profiles.id")


class WorkExperienceTable(SQLModel, table=True):
    """Database table definition for candidate Professional Work Experience."""
    __tablename__ = "work_experiences"

    id: UUID = Field(default_factory=generate_uuid7, primary_key=True)
    employer: str
    role: str
    location: str
    start_date: str
    end_date: str
    description: str

    profile_id: UUID = Field(foreign_key="profiles.id")


class ProjectTable(SQLModel, table=True):
    """Database table definition for candidate Projects."""
    __tablename__ = "projects"

    id: UUID = Field(default_factory=generate_uuid7, primary_key=True)
    name: str
    description: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    url: Optional[str] = None

    profile_id: UUID = Field(foreign_key="profiles.id")


class HackathonTable(SQLModel, table=True):
    """Database table definition for Hackathons and Competitions."""
    __tablename__ = "hackathons"

    id: UUID = Field(default_factory=generate_uuid7, primary_key=True)
    name: str
    organization: str
    date: str
    role_placement: str
    description: str

    profile_id: UUID = Field(foreign_key="profiles.id")


class AtomicFactTable(SQLModel, table=True):
    """Database table definition for Atomic Facts extracted from raw logs."""
    __tablename__ = "atomic_facts"

    id: UUID = Field(default_factory=generate_uuid7, primary_key=True)
    action: str
    metric_result: Optional[str] = None
    skills: str = Field(description="JSON-serialized list of skills")

    # Optional foreign keys referencing parent records
    work_experience_id: Optional[UUID] = Field(default=None, foreign_key="work_experiences.id")
    project_id: Optional[UUID] = Field(default=None, foreign_key="projects.id")
    hackathon_id: Optional[UUID] = Field(default=None, foreign_key="hackathons.id")


class HistoryTable(SQLModel, table=True):
    """Database table definition for Tailoring Session Generation History Logs."""
    __tablename__ = "history_entries"

    id: UUID = Field(default_factory=generate_uuid7, primary_key=True)
    company_name: str
    job_role: str
    timestamp: str
    file_path: str
    matched_keywords: str = Field(description="JSON-serialized list of matched keywords")



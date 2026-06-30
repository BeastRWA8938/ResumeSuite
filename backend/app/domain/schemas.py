from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from uuid import UUID

# --- PROFILE SCHEMAS ---

class ProfileBase(BaseModel):
    name: str = Field(..., min_length=1, description="Full name of the candidate")
    email: str = Field(..., description="Primary contact email address")
    phone: str = Field(..., min_length=5, description="Contact phone number")
    location: str = Field(..., min_length=2, description="Candidate current location (e.g. City, State)")
    website: Optional[str] = Field(None, description="Personal website/portfolio link")
    linkedin: Optional[str] = Field(None, description="LinkedIn profile link")
    github: Optional[str] = Field(None, description="GitHub profile link")

class ProfileCreate(ProfileBase):
    pass

class Profile(ProfileBase):
    id: UUID
    model_config = ConfigDict(from_attributes=True)


# --- EDUCATION SCHEMAS ---

class EducationBase(BaseModel):
    institution: str = Field(..., min_length=1, description="Name of school or university")
    location: str = Field(..., min_length=2, description="Institution location (e.g. City, State)")
    degree: str = Field(..., min_length=1, description="Type of degree earned (e.g. B.S., M.S.)")
    major: str = Field(..., min_length=1, description="Field of study or major")
    start_date: str = Field(..., description="Start date (e.g., YYYY-MM or Month YYYY)")
    graduation_date: str = Field(..., description="Graduation date or expected graduation date")
    gpa: Optional[str] = Field(None, description="Optional Cumulative GPA (e.g. 3.8/4.0)")

class EducationCreate(EducationBase):
    profile_id: UUID

class Education(EducationBase):
    id: UUID
    profile_id: UUID
    model_config = ConfigDict(from_attributes=True)


# --- WORK EXPERIENCE SCHEMAS ---

class WorkExperienceBase(BaseModel):
    employer: str = Field(..., min_length=1, description="Name of employer or organization")
    role: str = Field(..., min_length=1, description="Job title or role")
    location: str = Field(..., min_length=2, description="Location (e.g. City, State)")
    start_date: str = Field(..., description="Start date (e.g., YYYY-MM or Month YYYY)")
    end_date: str = Field(..., description="End date or 'Present'")
    description: str = Field(..., description="Raw unstructured text description of tasks and achievements")

class WorkExperienceCreate(WorkExperienceBase):
    profile_id: UUID

class WorkExperience(WorkExperienceBase):
    id: UUID
    profile_id: UUID
    model_config = ConfigDict(from_attributes=True)


# --- PROJECT SCHEMAS ---

class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, description="Name of the project")
    description: str = Field(..., description="Raw unstructured text description of project scope and achievements")
    start_date: str = Field(..., description="Start date (e.g., YYYY-MM)")
    end_date: str = Field(..., description="End date (e.g., YYYY-MM)")
    url: Optional[str] = Field(None, description="Optional link to project repository or deployment")

class ProjectCreate(ProjectBase):
    profile_id: UUID

class Project(ProjectBase):
    id: UUID
    profile_id: UUID
    model_config = ConfigDict(from_attributes=True)


# --- HACKATHON & COMPETITION SCHEMAS ---

class HackathonBase(BaseModel):
    name: str = Field(..., min_length=1, description="Name of the hackathon or event")
    organization: str = Field(..., min_length=1, description="Hosting organization")
    date: str = Field(..., description="Completion date of the event")
    role_placement: str = Field(..., description="Placement or role in the team (e.g., 1st Place, Participant)")
    description: str = Field(..., description="Raw unstructured description of project built and achievements")

class HackathonCreate(HackathonBase):
    profile_id: UUID

class Hackathon(HackathonBase):
    id: UUID
    profile_id: UUID
    model_config = ConfigDict(from_attributes=True)


# --- ATOMIC FACT SCHEMAS ---

class AtomicFactBase(BaseModel):
    action: str = Field(..., min_length=1, description="Active past-tense description of task or action taken")
    metric_result: Optional[str] = Field(None, description="Measurable metric or benefit, if any")
    skills: list[str] = Field(default_factory=list, description="List of technologies/skills applied")

class AtomicFactCreate(AtomicFactBase):
    work_experience_id: Optional[UUID] = None
    project_id: Optional[UUID] = None
    hackathon_id: Optional[UUID] = None

class AtomicFact(AtomicFactBase):
    id: UUID
    work_experience_id: Optional[UUID] = None
    project_id: Optional[UUID] = None
    hackathon_id: Optional[UUID] = None
    
    model_config = ConfigDict(from_attributes=True)


class AtomicFactMerge(AtomicFactBase):
    id: Optional[UUID] = None
    status: str = Field(..., description="Merge status: 'new' or 'update'")




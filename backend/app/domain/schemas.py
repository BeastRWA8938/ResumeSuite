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

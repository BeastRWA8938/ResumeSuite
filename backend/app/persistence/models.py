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

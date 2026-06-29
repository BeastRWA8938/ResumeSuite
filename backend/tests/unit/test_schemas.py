import time
from uuid import UUID
from app.core.uuid import generate_uuid7
from app.domain.schemas import ProfileCreate
from app.persistence.models import ProfileTable

def test_uuid7_generation():
    """Verify that generate_uuid7 creates valid, distinct, and time-ordered version 7 UUIDs."""
    u1 = generate_uuid7()
    time.sleep(0.002)  # Sleep 2ms to guarantee distinct timestamps
    u2 = generate_uuid7()
    
    assert isinstance(u1, UUID)
    assert isinstance(u2, UUID)
    assert u1 != u2
    
    # Verify version 7 metadata bit
    assert u1.version == 7
    assert u2.version == 7
    
    # Verify lexicographical timeline ordering (u1 is created before u2)
    assert str(u1) < str(u2)

def test_profile_create_validation():
    """Verify that ProfileCreate Pydantic schema parses and validates fields correctly."""
    valid_data = {
        "name": "Rushikesh",
        "email": "rushikesh@example.com",
        "phone": "+1234567890",
        "location": "Boston, MA"
    }
    profile_in = ProfileCreate(**valid_data)
    assert profile_in.name == "Rushikesh"
    assert profile_in.email == "rushikesh@example.com"
    assert profile_in.phone == "+1234567890"
    assert profile_in.location == "Boston, MA"

def test_profile_table_instantiation():
    """Verify that SQLModel tables generate a time-ordered UUIDv7 default ID upon creation."""
    profile_db = ProfileTable(
        name="Rushikesh",
        email="rush@example.com",
        phone="+1234567890",
        location="Boston, MA"
    )
    assert isinstance(profile_db.id, UUID)
    assert profile_db.id.version == 7
    assert profile_db.name == "Rushikesh"


# --- NEW WORK EXPERIENCE, PROJECT, & HACKATHON UNIT TESTS ---

from app.domain.schemas import WorkExperienceCreate, ProjectCreate, HackathonCreate
from app.persistence.models import WorkExperienceTable, ProjectTable, HackathonTable

def test_work_experience_validation_and_instantiation():
    profile_id = generate_uuid7()
    
    # 1. Pydantic validation check
    data = {
        "employer": "Acme Corp",
        "role": "Software Engineer",
        "location": "Boston, MA",
        "start_date": "2020-01",
        "end_date": "2022-12",
        "description": "Built cool stuff.",
        "profile_id": profile_id
    }
    work_in = WorkExperienceCreate(**data)
    assert work_in.employer == "Acme Corp"
    assert work_in.profile_id == profile_id

    # 2. SQLModel table instantiation check
    work_db = WorkExperienceTable(
        employer="Acme Corp",
        role="Software Engineer",
        location="Boston, MA",
        start_date="2020-01",
        end_date="2022-12",
        description="Built cool stuff.",
        profile_id=profile_id
    )
    assert isinstance(work_db.id, UUID)
    assert work_db.id.version == 7
    assert work_db.employer == "Acme Corp"


def test_project_validation_and_instantiation():
    profile_id = generate_uuid7()
    
    # 1. Pydantic validation check
    data = {
        "name": "ResumeTailor",
        "description": "Fast resume synthesis.",
        "start_date": "2023-01",
        "end_date": "2023-05",
        "url": "https://github.com/example/resumetailor",
        "profile_id": profile_id
    }
    proj_in = ProjectCreate(**data)
    assert proj_in.name == "ResumeTailor"
    assert proj_in.profile_id == profile_id

    # 2. SQLModel table instantiation check
    proj_db = ProjectTable(
        name="ResumeTailor",
        description="Fast resume synthesis.",
        start_date="2023-01",
        end_date="2023-05",
        url="https://github.com/example/resumetailor",
        profile_id=profile_id
    )
    assert isinstance(proj_db.id, UUID)
    assert proj_db.id.version == 7
    assert proj_db.name == "ResumeTailor"


def test_hackathon_validation_and_instantiation():
    profile_id = generate_uuid7()
    
    # 1. Pydantic validation check
    data = {
        "name": "MIT Hackathon 2024",
        "organization": "MIT",
        "date": "2024-02",
        "role_placement": "1st Place",
        "description": "Built AI agent.",
        "profile_id": profile_id
    }
    hack_in = HackathonCreate(**data)
    assert hack_in.name == "MIT Hackathon 2024"
    assert hack_in.profile_id == profile_id

    # 2. SQLModel table instantiation check
    hack_db = HackathonTable(
        name="MIT Hackathon 2024",
        organization="MIT",
        date="2024-02",
        role_placement="1st Place",
        description="Built AI agent.",
        profile_id=profile_id
    )
    assert isinstance(hack_db.id, UUID)
    assert hack_db.id.version == 7
    assert hack_db.name == "MIT Hackathon 2024"


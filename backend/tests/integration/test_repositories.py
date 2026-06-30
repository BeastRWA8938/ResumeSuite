import pytest
from sqlmodel import SQLModel, Session, create_engine
from app.domain.schemas import ProfileCreate, EducationCreate
from app.persistence.repositories import SQLProfileRepository, SQLEducationRepository

@pytest.fixture(name="db_session")
def db_session_fixture():
    """Provides an isolated, in-memory SQLite database session for integration tests."""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

def test_profile_repository_flow(db_session):
    """Verify that the SQLProfileRepository behaves correctly under single-user rules."""
    repo = SQLProfileRepository(db_session)
    
    # 1. Initially profile is empty
    assert repo.get() is None
    
    # 2. Create the profile
    profile_in = ProfileCreate(
        name="Rushikesh",
        email="rushikesh@example.com",
        phone="+1234567890",
        location="Boston, MA"
    )
    profile_saved = repo.save(profile_in)
    assert profile_saved.name == "Rushikesh"
    
    # 3. Retrieve and assert correctness
    profile_fetched = repo.get()
    assert profile_fetched is not None
    assert profile_fetched.id == profile_saved.id
    
    # 4. Save updates the existing single profile instead of duplicating it
    profile_update = ProfileCreate(
        name="Rushikesh R",
        email="rushikesh.r@example.com",
        phone="+19876543210",
        location="San Francisco, CA"
    )
    profile_updated = repo.save(profile_update)
    assert profile_updated.id == profile_saved.id
    assert profile_updated.name == "Rushikesh R"
    
    # Verify DB row count remains exactly 1
    from app.persistence.models import ProfileTable
    from sqlmodel import select
    profiles = db_session.exec(select(ProfileTable)).all()
    assert len(profiles) == 1

def test_education_repository_flow(db_session):
    """Verify SQLEducationRepository supports CRUD and links correctly to the Profile ID."""
    profile_repo = SQLProfileRepository(db_session)
    edu_repo = SQLEducationRepository(db_session)
    
    # Seed a profile to act as our owner
    profile = profile_repo.save(ProfileCreate(
        name="Rushikesh",
        email="rush@example.com",
        phone="+12345",
        location="Boston"
    ))
    
    # 1. Create education entry
    edu_in = EducationCreate(
        institution="Boston University",
        location="Boston, MA",
        degree="B.S.",
        major="Computer Science",
        start_date="2022-09",
        graduation_date="2026-05",
        gpa="3.8",
        profile_id=profile.id
    )
    edu_saved = edu_repo.save(edu_in)
    assert edu_saved.institution == "Boston University"
    assert edu_saved.profile_id == profile.id
    
    # 2. Retrieve by ID
    edu_fetched = edu_repo.get_by_id(edu_saved.id)
    assert edu_fetched is not None
    assert edu_fetched.major == "Computer Science"
    
    # 3. Query lists for the candidate profile
    edus = edu_repo.get_by_profile_id(profile.id)
    assert len(edus) == 1
    assert edus[0].id == edu_saved.id
    
    # 4. Update the entry
    edu_update = EducationCreate(
        institution="Boston University",
        location="Boston, MA",
        degree="B.S. (Honors)",
        major="Computer Science",
        start_date="2022-09",
        graduation_date="2026-05",
        gpa="3.9",
        profile_id=profile.id
    )
    edu_updated = edu_repo.update(edu_saved.id, edu_update)
    assert edu_updated is not None
    assert edu_updated.degree == "B.S. (Honors)"
    assert edu_updated.gpa == "3.9"
    
    # 5. Delete the entry
    delete_result = edu_repo.delete(edu_saved.id)
    assert delete_result is True
    assert edu_repo.get_by_id(edu_saved.id) is None


# --- WORK EXPERIENCE, PROJECT, AND HACKATHON INTEGRATION TESTS ---

from app.domain.schemas import WorkExperienceCreate, ProjectCreate, HackathonCreate
from app.persistence.repositories import (
    SQLWorkExperienceRepository, SQLProjectRepository, SQLHackathonRepository
)

def test_work_experience_repository_flow(db_session):
    """Verify SQLWorkExperienceRepository handles CRUD and cascading links to Profile."""
    profile_repo = SQLProfileRepository(db_session)
    exp_repo = SQLWorkExperienceRepository(db_session)
    
    profile = profile_repo.save(ProfileCreate(
        name="Rushikesh", email="rush@example.com", phone="+12345", location="Boston"
    ))
    
    # 1. Create entry
    exp_in = WorkExperienceCreate(
        employer="Stark Industries",
        role="AI Engineer Intern",
        location="Los Angeles, CA",
        start_date="2024-05",
        end_date="2024-08",
        description="Assisted J.A.R.V.I.S. modules integration.",
        profile_id=profile.id
    )
    exp_saved = exp_repo.save(exp_in)
    assert exp_saved.employer == "Stark Industries"
    assert exp_saved.profile_id == profile.id
    
    # 2. Retrieve by ID
    exp_fetched = exp_repo.get_by_id(exp_saved.id)
    assert exp_fetched is not None
    assert exp_fetched.role == "AI Engineer Intern"
    
    # 3. Query all by profile ID
    exps = exp_repo.get_by_profile_id(profile.id)
    assert len(exps) == 1
    assert exps[0].id == exp_saved.id
    
    # 4. Update entry
    exp_update = WorkExperienceCreate(
        employer="Stark Industries",
        role="AI Engineer I",
        location="Los Angeles, CA",
        start_date="2024-05",
        end_date="Present",
        description="Assisted J.A.R.V.I.S. modules integration and telemetry logs.",
        profile_id=profile.id
    )
    exp_updated = exp_repo.update(exp_saved.id, exp_update)
    assert exp_updated is not None
    assert exp_updated.role == "AI Engineer I"
    assert exp_updated.end_date == "Present"
    
    # 5. Delete entry
    assert exp_repo.delete(exp_saved.id) is True
    assert exp_repo.get_by_id(exp_saved.id) is None


def test_project_repository_flow(db_session):
    """Verify SQLProjectRepository handles CRUD and cascading links to Profile."""
    profile_repo = SQLProfileRepository(db_session)
    proj_repo = SQLProjectRepository(db_session)
    
    profile = profile_repo.save(ProfileCreate(
        name="Rushikesh", email="rush@example.com", phone="+12345", location="Boston"
    ))
    
    # 1. Create entry
    proj_in = ProjectCreate(
        name="Vibranium Shield CAD",
        description="Simulating dynamic load resilience equations.",
        start_date="2023-09",
        end_date="2023-12",
        url="https://github.com/stark/shield-cad",
        profile_id=profile.id
    )
    proj_saved = proj_repo.save(proj_in)
    assert proj_saved.name == "Vibranium Shield CAD"
    assert proj_saved.profile_id == profile.id
    
    # 2. Retrieve by ID
    proj_fetched = proj_repo.get_by_id(proj_saved.id)
    assert proj_fetched is not None
    assert proj_fetched.description == "Simulating dynamic load resilience equations."
    
    # 3. Query all by profile ID
    projs = proj_repo.get_by_profile_id(profile.id)
    assert len(projs) == 1
    assert projs[0].id == proj_saved.id
    
    # 4. Update entry
    proj_update = ProjectCreate(
        name="Vibranium Shield CAD v2",
        description="Simulating dynamic load resilience equations with thermal dissipation.",
        start_date="2023-09",
        end_date="2024-02",
        url="https://github.com/stark/shield-cad",
        profile_id=profile.id
    )
    proj_updated = proj_repo.update(proj_saved.id, proj_update)
    assert proj_updated is not None
    assert proj_updated.name == "Vibranium Shield CAD v2"
    
    # 5. Delete entry
    assert proj_repo.delete(proj_saved.id) is True
    assert proj_repo.get_by_id(proj_saved.id) is None


def test_hackathon_repository_flow(db_session):
    """Verify SQLHackathonRepository handles CRUD and cascading links to Profile."""
    profile_repo = SQLProfileRepository(db_session)
    hack_repo = SQLHackathonRepository(db_session)
    
    profile = profile_repo.save(ProfileCreate(
        name="Rushikesh", email="rush@example.com", phone="+12345", location="Boston"
    ))
    
    # 1. Create entry
    hack_in = HackathonCreate(
        name="Stark Hackathon 2024",
        organization="Stark Industries",
        date="2024-03",
        role_placement="Grand Prize Winner",
        description="Built low-cost telemetry node.",
        profile_id=profile.id
    )
    hack_saved = hack_repo.save(hack_in)
    assert hack_saved.name == "Stark Hackathon 2024"
    assert hack_saved.profile_id == profile.id
    
    # 2. Retrieve by ID
    hack_fetched = hack_repo.get_by_id(hack_saved.id)
    assert hack_fetched is not None
    assert hack_fetched.role_placement == "Grand Prize Winner"
    
    # 3. Query all by profile ID
    hacks = hack_repo.get_by_profile_id(profile.id)
    assert len(hacks) == 1
    assert hacks[0].id == hack_saved.id
    
    # 4. Update entry
    hack_update = HackathonCreate(
        name="Stark Hackathon 2024",
        organization="Stark Industries & S.H.I.E.L.D.",
        date="2024-03",
        role_placement="Grand Prize Winner",
        description="Built low-cost telemetry node with mesh routing.",
        profile_id=profile.id
    )
    hack_updated = hack_repo.update(hack_saved.id, hack_update)
    assert hack_updated is not None
    assert hack_updated.organization == "Stark Industries & S.H.I.E.L.D."
    
    # 5. Delete entry
    assert hack_repo.delete(hack_saved.id) is True
    assert hack_repo.get_by_id(hack_saved.id) is None

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

import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlalchemy.pool import StaticPool
from app.main import app
from app.persistence.db import get_session
from app.persistence.models import ProfileTable, EducationTable

# Configure in-memory SQLite for isolated API endpoint testing
# Use StaticPool to maintain a single connection across FastAPI requests
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)

def override_get_session():
    with Session(test_engine) as session:
        yield session

# Inject dependency override
app.dependency_overrides[get_session] = override_get_session

client = TestClient(app)

@pytest.fixture(autouse=True)
def init_test_db():
    """Drops and recreates all database tables in-memory for each test session."""
    SQLModel.metadata.drop_all(test_engine)
    SQLModel.metadata.create_all(test_engine)
    yield

def test_profile_and_education_endpoints_workflow():
    """Runs a complete vertical check over Profile and Education API endpoints."""
    # 1. GET profile - expected 404 (empty vault)
    response = client.get("/api/profile")
    assert response.status_code == 404
    assert response.json()["detail"] == "Profile not found"
    
    # 2. POST profile - expected 201 (created)
    profile_data = {
        "name": "Rushikesh",
        "email": "rushikesh@example.com",
        "phone": "+1234567890",
        "location": "Boston, MA",
        "website": "https://example.com"
    }
    response = client.post("/api/profile", json=profile_data)
    assert response.status_code == 201
    profile = response.json()
    assert profile["name"] == "Rushikesh"
    assert "id" in profile
    profile_id = profile["id"]
    
    # 3. GET profile again - expected 200 (ok)
    response = client.get("/api/profile")
    assert response.status_code == 200
    assert response.json()["id"] == profile_id
    
    # 4. POST education - expected 201 (created)
    edu_data = {
        "institution": "Boston University",
        "location": "Boston, MA",
        "degree": "B.S.",
        "major": "Computer Science",
        "start_date": "2022-09",
        "graduation_date": "2026-05",
        "gpa": "3.8",
        "profile_id": profile_id
    }
    response = client.post("/api/education", json=edu_data)
    assert response.status_code == 201
    edu = response.json()
    assert edu["institution"] == "Boston University"
    edu_id = edu["id"]
    
    # 5. GET education by profile_id - expected 200 (ok)
    response = client.get(f"/api/education/profile/{profile_id}")
    assert response.status_code == 200
    edus = response.json()
    assert len(edus) == 1
    assert edus[0]["id"] == edu_id
    
    # 6. PUT education - expected 200 (ok)
    edu_update = {
        "institution": "Boston University",
        "location": "Boston, MA",
        "degree": "B.S. (Honors)",
        "major": "Computer Science",
        "start_date": "2022-09",
        "graduation_date": "2026-05",
        "gpa": "3.9",
        "profile_id": profile_id
    }
    response = client.put(f"/api/education/{edu_id}", json=edu_update)
    assert response.status_code == 200
    assert response.json()["degree"] == "B.S. (Honors)"
    assert response.json()["gpa"] == "3.9"
    
    # 7. DELETE education - expected 200 (ok)
    response = client.delete(f"/api/education/{edu_id}")
    assert response.status_code == 200
    assert response.json() == {"success": True, "detail": "Education record deleted"}
    
    # 8. GET education by profile_id - expected empty list
    response = client.get(f"/api/education/profile/{profile_id}")
    assert response.status_code == 200
    assert len(response.json()) == 0

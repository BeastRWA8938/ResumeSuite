import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlalchemy.pool import StaticPool
from unittest.mock import MagicMock, patch
from app.main import app
from app.persistence.db import get_session
from app.persistence.models import (
    ProfileTable, EducationTable,
    WorkExperienceTable, ProjectTable, HackathonTable,
    AtomicFactTable
)

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

    # 9. POST work-experience - expected 201 (created)
    exp_data = {
        "employer": "Acme Corp",
        "role": "Software Engineer",
        "location": "Boston, MA",
        "start_date": "2020-01",
        "end_date": "Present",
        "description": "Built cloud backend.",
        "profile_id": profile_id
    }
    response = client.post("/api/work-experience", json=exp_data)
    assert response.status_code == 201
    exp = response.json()
    assert exp["employer"] == "Acme Corp"
    exp_id = exp["id"]

    # 10. GET work-experience by profile - expected 200 (ok)
    response = client.get(f"/api/work-experience/profile/{profile_id}")
    assert response.status_code == 200
    exps = response.json()
    assert len(exps) == 1
    assert exps[0]["id"] == exp_id

    # 11. PUT work-experience - expected 200 (ok)
    exp_update = {
        "employer": "Acme Corp",
        "role": "Senior Software Engineer",
        "location": "Boston, MA",
        "start_date": "2020-01",
        "end_date": "Present",
        "description": "Built scalable cloud backend.",
        "profile_id": profile_id
    }
    response = client.put(f"/api/work-experience/{exp_id}", json=exp_update)
    assert response.status_code == 200
    assert response.json()["role"] == "Senior Software Engineer"

    # 12. DELETE work-experience - expected 200 (ok)
    response = client.delete(f"/api/work-experience/{exp_id}")
    assert response.status_code == 200
    assert response.json() == {"success": True, "detail": "Work experience record deleted"}

    # 13. POST project - expected 201 (created)
    proj_data = {
        "name": "ResumeTailor",
        "description": "Fast resume synthesis.",
        "start_date": "2023-01",
        "end_date": "2023-05",
        "url": "https://github.com/example/resumetailor",
        "profile_id": profile_id
    }
    response = client.post("/api/project", json=proj_data)
    assert response.status_code == 201
    proj = response.json()
    assert proj["name"] == "ResumeTailor"
    proj_id = proj["id"]

    # 14. GET project by profile - expected 200 (ok)
    response = client.get(f"/api/project/profile/{profile_id}")
    assert response.status_code == 200
    projs = response.json()
    assert len(projs) == 1
    assert projs[0]["id"] == proj_id

    # 15. PUT project - expected 200 (ok)
    proj_update = {
        "name": "ResumeTailor Pro",
        "description": "Synthesize resumes in seconds.",
        "start_date": "2023-01",
        "end_date": "2023-06",
        "url": "https://github.com/example/resumetailor",
        "profile_id": profile_id
    }
    response = client.put(f"/api/project/{proj_id}", json=proj_update)
    assert response.status_code == 200
    assert response.json()["name"] == "ResumeTailor Pro"

    # 16. DELETE project - expected 200 (ok)
    response = client.delete(f"/api/project/{proj_id}")
    assert response.status_code == 200
    assert response.json() == {"success": True, "detail": "Project record deleted"}

    # 17. POST hackathon - expected 201 (created)
    hack_data = {
        "name": "MIT Hackathon 2024",
        "organization": "MIT",
        "date": "2024-02",
        "role_placement": "1st Place",
        "description": "Built AI agent.",
        "profile_id": profile_id
    }
    response = client.post("/api/hackathon", json=hack_data)
    assert response.status_code == 201
    hack = response.json()
    assert hack["name"] == "MIT Hackathon 2024"
    hack_id = hack["id"]

    # 18. GET hackathon by profile - expected 200 (ok)
    response = client.get(f"/api/hackathon/profile/{profile_id}")
    assert response.status_code == 200
    hacks = response.json()
    assert len(hacks) == 1
    assert hacks[0]["id"] == hack_id

    # 19. PUT hackathon - expected 200 (ok)
    hack_update = {
        "name": "MIT Hackathon 2024",
        "organization": "MIT & Harvard",
        "date": "2024-02",
        "role_placement": "Grand Prize Winner",
        "description": "Built cooperative multi-agent system.",
        "profile_id": profile_id
    }
    response = client.put(f"/api/hackathon/{hack_id}", json=hack_update)
    assert response.status_code == 200
    assert response.json()["organization"] == "MIT & Harvard"

    # 20. DELETE hackathon - expected 200 (ok)
    response = client.delete(f"/api/hackathon/{hack_id}")
    assert response.status_code == 200
    assert response.json() == {"success": True, "detail": "Hackathon record deleted"}

    # 21. POST fact/extract - expected 200 (ok)
    with patch("google.generativeai.GenerativeModel") as mock_model_class:
        mock_model_instance = MagicMock()
        mock_model_class.return_value = mock_model_instance
        mock_response = MagicMock()
        mock_response.text = """
        [
          {
            "id": null,
            "action": "Built cloud backend",
            "metric_result": "improving database throughput by 40%",
            "skills": ["Python", "FastAPI"],
            "status": "new"
          }
        ]
        """
        mock_model_instance.generate_content.return_value = mock_response

        response = client.post("/api/fact/extract", json={"raw_description": "Built cloud backend with FastAPI."})
        assert response.status_code == 200
        extracted = response.json()
        assert len(extracted) == 1
        assert extracted[0]["action"] == "Built cloud backend"
        assert extracted[0]["skills"] == ["Python", "FastAPI"]

    # Let's create a work experience container first
    exp_data = {
        "employer": "Acme Corp",
        "role": "Software Engineer",
        "location": "Boston, MA",
        "start_date": "2020-01",
        "end_date": "Present",
        "description": "Built cloud backend.",
        "profile_id": profile_id
    }
    response = client.post("/api/work-experience", json=exp_data)
    assert response.status_code == 201
    exp_id = response.json()["id"]

    # 22. POST fact - expected 201 (created)
    fact_data = {
        "action": "Designed backend CORS API",
        "metric_result": "reducing latency by 10%",
        "skills": ["FastAPI", "CORS"],
        "work_experience_id": exp_id
    }
    response = client.post("/api/fact", json=fact_data)
    assert response.status_code == 201
    fact = response.json()
    assert fact["action"] == "Designed backend CORS API"
    fact_id = fact["id"]

    # 23. GET fact by work-experience - expected list with 1 item
    response = client.get(f"/api/fact/work-experience/{exp_id}")
    assert response.status_code == 200
    facts = response.json()
    assert len(facts) == 1
    assert facts[0]["id"] == fact_id
    assert facts[0]["skills"] == ["FastAPI", "CORS"]

    # 24. PUT fact - expected 200 (ok)
    fact_update = {
        "action": "Designed scalable backend CORS API",
        "metric_result": "reducing latency by 15%",
        "skills": ["FastAPI", "CORS", "Docker"],
        "work_experience_id": exp_id
    }
    response = client.put(f"/api/fact/{fact_id}", json=fact_update)
    assert response.status_code == 200
    assert response.json()["action"] == "Designed scalable backend CORS API"
    assert response.json()["skills"] == ["FastAPI", "CORS", "Docker"]

    # 25. DELETE fact - expected 200 (ok)
    response = client.delete(f"/api/fact/{fact_id}")
    assert response.status_code == 200
    assert response.json() == {"success": True, "detail": "Atomic fact deleted"}

    # 26. Pipeline Merging Test (Slice 5 Step 3)
    # Query facts for exp_id and delete them all to start clean
    response = client.get(f"/api/fact/work-experience/{exp_id}")
    existing_facts = response.json()
    for fact in existing_facts:
        client.delete(f"/api/fact/{fact['id']}")

    # Extract initial description
    with patch("google.generativeai.GenerativeModel") as mock_model_class:
        mock_model_instance = MagicMock()
        mock_model_class.return_value = mock_model_instance
        mock_response = MagicMock()
        mock_response.text = """
        [
          {
            "id": null,
            "action": "Optimized database queries",
            "metric_result": "reducing latency by 10%",
            "skills": ["SQLite"],
            "status": "new"
          }
        ]
        """
        mock_model_instance.generate_content.return_value = mock_response

        response = client.post("/api/fact/extract", json={"raw_description": "Initial text description"})
        assert response.status_code == 200
        initial_drafts = response.json()
        assert len(initial_drafts) == 1

    # Merge initial drafts
    response = client.post("/api/fact/merge", json={
        "facts": initial_drafts,
        "parent_id": str(exp_id),
        "parent_type": "work_experience"
    })
    assert response.status_code == 200
    saved_initial = response.json()
    assert len(saved_initial) == 1
    first_fact_id = saved_initial[0]["id"]

    # Extract updated description, passing the existing facts
    with patch("google.generativeai.GenerativeModel") as mock_model_class:
        mock_model_instance = MagicMock()
        mock_model_class.return_value = mock_model_instance
        mock_response = MagicMock()
        mock_response.text = f"""
        [
          {{
            "id": "{first_fact_id}",
            "action": "Optimized database queries in SQLite",
            "metric_result": "reducing latency by 30%",
            "skills": ["SQLite", "SQLModel"],
            "status": "update"
          }},
          {{
            "id": null,
            "action": "Configured database indexes",
            "metric_result": "speeding up index scans",
            "skills": ["SQLite"],
            "status": "new"
          }}
        ]
        """
        mock_model_instance.generate_content.return_value = mock_response

        payload = {
            "raw_description": "Updated text description",
            "existing_facts": saved_initial
        }
        response = client.post("/api/fact/extract", json=payload)
        assert response.status_code == 200
        updated_drafts = response.json()
        assert len(updated_drafts) == 2

    # Merge updated drafts
    response = client.post("/api/fact/merge", json={
        "facts": updated_drafts,
        "parent_id": str(exp_id),
        "parent_type": "work_experience"
    })
    assert response.status_code == 200
    merged_final = response.json()
    assert len(merged_final) == 2

    # Verify DB values are merged and de-duplicated
    response = client.get(f"/api/fact/work-experience/{exp_id}")
    assert response.status_code == 200
    final_facts = response.json()
    assert len(final_facts) == 2

    updated_row = next(f for f in final_facts if f["id"] == first_fact_id)
    assert updated_row["action"] == "Optimized database queries in SQLite"
    assert updated_row["metric_result"] == "reducing latency by 30%"
    assert updated_row["skills"] == ["SQLite", "SQLModel"]

    new_row = next(f for f in final_facts if f["id"] != first_fact_id)
    assert new_row["action"] == "Configured database indexes"


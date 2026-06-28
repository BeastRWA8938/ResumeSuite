from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_root():
    """Verify that the health check route returns a 200 OK and correct service info."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "service": "Career Intelligence System API",
        "version": "1.0.0"
    }

def test_cors_headers():
    """Verify that the API returns the correct Access-Control headers for the frontend origin."""
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "content-type"
    }
    response = client.options("/", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"

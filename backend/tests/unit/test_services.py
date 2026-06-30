import pytest
from unittest.mock import MagicMock, patch
from uuid import UUID
from app.infrastructure.services import GeminiFactExtractionService
from app.domain.schemas import AtomicFact, AtomicFactMerge

@patch("google.generativeai.GenerativeModel")
def test_gemini_fact_extraction_new_flow(mock_model_class):
    """Verify that when no existing facts are provided, the extracted facts are marked as 'new'."""
    mock_model_instance = MagicMock()
    mock_model_class.return_value = mock_model_instance
    
    mock_response = MagicMock()
    mock_response.text = """
    [
      {
        "id": null,
        "action": "Designed and deployed client-server CORS pipeline",
        "metric_result": "reducing latency by 15%",
        "skills": ["FastAPI", "CORS"],
        "status": "new"
      }
    ]
    """
    mock_model_instance.generate_content.return_value = mock_response

    service = GeminiFactExtractionService(api_key="mock-api-key")
    facts = service.extract_facts("Raw description text", existing_facts=[])

    assert len(facts) == 1
    assert isinstance(facts[0], AtomicFactMerge)
    assert facts[0].action == "Designed and deployed client-server CORS pipeline"
    assert facts[0].status == "new"
    assert facts[0].id is None

@patch("google.generativeai.GenerativeModel")
def test_gemini_fact_extraction_merge_flow(mock_model_class):
    """Verify that when existing facts are supplied, updates return the matching fact UUID."""
    mock_model_instance = MagicMock()
    mock_model_class.return_value = mock_model_instance
    
    existing_uuid = UUID("7f3a2b1c-9012-3456-789a-bcde12345678")
    
    mock_response = MagicMock()
    mock_response.text = f"""
    [
      {{
        "id": "{str(existing_uuid)}",
        "action": "Optimized database write-lock queues",
        "metric_result": "reducing error rate to 0%",
        "skills": ["SQLite", "SQLModel"],
        "status": "update"
      }},
      {{
        "id": null,
        "action": "Added Prometheus monitoring",
        "metric_result": "tracking API performance",
        "skills": ["Prometheus", "Grafana"],
        "status": "new"
      }}
    ]
    """
    mock_model_instance.generate_content.return_value = mock_response

    existing = [
        AtomicFact(
            id=existing_uuid,
            action="Optimized database queues",
            metric_result="reducing error rates",
            skills=["SQLite"]
        )
    ]

    service = GeminiFactExtractionService(api_key="mock-api-key")
    facts = service.extract_facts("New text logs", existing_facts=existing)

    assert len(facts) == 2
    
    # Assert updated fact characteristics
    assert facts[0].id == existing_uuid
    assert facts[0].status == "update"
    assert facts[0].action == "Optimized database write-lock queues"
    assert facts[0].skills == ["SQLite", "SQLModel"]

    # Assert new fact characteristics
    assert facts[1].id is None
    assert facts[1].status == "new"
    assert facts[1].action == "Added Prometheus monitoring"

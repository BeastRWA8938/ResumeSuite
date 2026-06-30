import pytest
from unittest.mock import MagicMock, patch
from app.infrastructure.services import GeminiFactExtractionService
from app.domain.schemas import AtomicFactCreate

@patch("google.generativeai.GenerativeModel")
def test_gemini_fact_extraction_service_flow(mock_model_class):
    """Verify that the GeminiFactExtractionService parses mock inputs and returns AtomicFactCreate schemas."""
    # Setup mock model and response interfaces
    mock_model_instance = MagicMock()
    mock_model_class.return_value = mock_model_instance
    
    mock_response = MagicMock()
    mock_response.text = """
    [
      {
        "action": "Designed and deployed client-server CORS pipeline",
        "metric_result": "reducing latency by 15%",
        "skills": ["FastAPI", "CORS"]
      },
      {
        "action": "Refactored database write queues",
        "metric_result": null,
        "skills": ["SQLite"]
      }
    ]
    """
    mock_model_instance.generate_content.return_value = mock_response

    # Instantiate concrete service with mock credentials
    service = GeminiFactExtractionService(api_key="mock-api-key-pass")
    
    raw_text = "I designed and deployed a client-server CORS pipeline reducing latency by 15% using FastAPI. Also refactored SQLite queues."
    facts = service.extract_facts(raw_text)

    # Assert correct parses mapping
    assert len(facts) == 2
    
    assert isinstance(facts[0], AtomicFactCreate)
    assert facts[0].action == "Designed and deployed client-server CORS pipeline"
    assert facts[0].metric_result == "reducing latency by 15%"
    assert facts[0].skills == ["FastAPI", "CORS"]
    
    assert isinstance(facts[1], AtomicFactCreate)
    assert facts[1].action == "Refactored database write queues"
    assert facts[1].metric_result is None
    assert facts[1].skills == ["SQLite"]

    # Verify underlying generativeai model config instantiation parameters
    mock_model_class.assert_called_once_with("gemini-2.5-flash")
    
    # Verify content call options carry structured response constraints
    mock_model_instance.generate_content.assert_called_once()
    args, kwargs = mock_model_instance.generate_content.call_args
    assert raw_text in args[0]
    assert kwargs["generation_config"]["response_mime_type"] == "application/json"
    assert kwargs["generation_config"]["temperature"] == 0.1

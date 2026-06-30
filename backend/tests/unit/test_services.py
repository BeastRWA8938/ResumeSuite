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


from app.domain.schemas import FactRankResult
from app.infrastructure.services import GeminiRelevanceRankingService

@patch("google.generativeai.GenerativeModel")
def test_gemini_relevance_ranking_service_flow(mock_model_class):
    """Verify that GeminiRelevanceRankingService scores facts and returns sorted results."""
    mock_model_instance = MagicMock()
    mock_model_class.return_value = mock_model_instance
    
    fact_id1 = UUID("e2a9b3c4-1234-5678-abcd-1234567890ab")
    fact_id2 = UUID("7f3a2b1c-9012-3456-789a-bcde12345678")
    fact_id3 = UUID("1a2b3c4d-5678-9012-3456-789abcdef012") # will remain unranked in response
    
    # Mock LLM response
    mock_response = MagicMock()
    mock_response.text = f"""
    [
      {{
        "id": "{str(fact_id2)}",
        "score": 0.45,
        "matched_keywords": ["SQLite"]
      }},
      {{
        "id": "{str(fact_id1)}",
        "score": 0.90,
        "matched_keywords": ["FastAPI", "CORS"]
      }}
    ]
    """
    mock_model_instance.generate_content.return_value = mock_response

    facts = [
        AtomicFact(id=fact_id1, action="Built CORS API in FastAPI", skills=["FastAPI"]),
        AtomicFact(id=fact_id2, action="Optimized SQLite query cache", skills=["SQLite"]),
        AtomicFact(id=fact_id3, action="Wrote Java unit tests", skills=["Java"])
    ]

    service = GeminiRelevanceRankingService(api_key="mock-api-key")
    ranked_results = service.rank_facts(
        facts=facts,
        job_description="Looking for FastAPI developers with basic SQLite knowledge.",
        company_context="Acme Tech"
    )

    # Verify length (all 3 input facts should be returned, including the unranked one with 0.0 score)
    assert len(ranked_results) == 3

    # Verify descending sort order
    assert ranked_results[0].fact.id == fact_id1
    assert ranked_results[0].score == 0.90
    assert ranked_results[0].matched_keywords == ["FastAPI", "CORS"]

    assert ranked_results[1].fact.id == fact_id2
    assert ranked_results[1].score == 0.45
    assert ranked_results[1].matched_keywords == ["SQLite"]

    # Verify unranked fallback
    assert ranked_results[2].fact.id == fact_id3
    assert ranked_results[2].score == 0.0
    assert ranked_results[2].matched_keywords == []

    # Verify model parameters
    mock_model_class.assert_called_once_with("gemini-2.5-flash")


from app.infrastructure.services import GeminiResumeSynthesisService

@patch("google.generativeai.GenerativeModel")
def test_gemini_resume_synthesis_flow(mock_model_class):
    """Verify that GeminiResumeSynthesisService structures synthesis responses correctly."""
    mock_model_instance = MagicMock()
    mock_model_class.return_value = mock_model_instance
    
    fact_id1 = UUID("e2a9b3c4-1234-5678-abcd-1234567890ab")
    
    mock_response = MagicMock()
    mock_response.text = f"""
    {{
      "bullets": [
        {{
          "fact_id": "{str(fact_id1)}",
          "synthesized_bullet": "Developed API with FastAPI, speeding up data queries by 30%."
        }}
      ],
      "skills": {{
        "Languages": ["Python"],
        "Frameworks": ["FastAPI"]
      }}
    }}
    """
    mock_model_instance.generate_content.return_value = mock_response

    facts = [
        AtomicFact(id=fact_id1, action="Built FastAPI API", skills=["FastAPI"])
    ]
    all_skills = ["Python", "FastAPI"]

    service = GeminiResumeSynthesisService(api_key="mock-api-key")
    res = service.synthesize_resume_content(
        facts=facts,
        all_skills=all_skills,
        job_description="FastAPI role",
        company_context="Acme Tech"
    )

    assert len(res.bullets) == 1
    assert res.bullets[0].fact_id == fact_id1
    assert res.bullets[0].synthesized_bullet == "Developed API with FastAPI, speeding up data queries by 30%."
    assert "Languages" in res.skills
    assert res.skills["Languages"] == ["Python"]


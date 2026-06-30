import os
import json
from typing import List, Optional
from uuid import UUID
import google.generativeai as genai
from app.domain.services import FactExtractionService
from app.domain.schemas import AtomicFact, AtomicFactMerge

class GeminiFactExtractionService(FactExtractionService):
    """Concrete implementation of FactExtractionService using the Google Gemini SDK."""

    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
        
        # Resolve prompt template path dynamically
        current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.prompt_template_path = os.path.join(current_dir, "core", "prompts", "fact_extraction.txt")

    def _load_prompt_template(self) -> str:
        """Reads prompt instructions from disk."""
        with open(self.prompt_template_path, "r", encoding="utf-8") as f:
            return f.read()

    def extract_facts(self, raw_description: str, existing_facts: List[AtomicFact] = []) -> List[AtomicFactMerge]:
        """
        Sends raw text block and existing facts to Gemini API.
        Returns a list of structured AtomicFactMerge instructions.
        """
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not configured.")

        # Serialize existing facts into readable JSON for prompt injection
        existing_facts_str = json.dumps([
            {
                "id": str(f.id),
                "action": f.action,
                "metric_result": f.metric_result,
                "skills": f.skills
            } for f in existing_facts
        ], indent=2)

        # Format prompt payload
        template = self._load_prompt_template()
        prompt = template.format(
            raw_description=raw_description,
            existing_facts=existing_facts_str
        )

        # Boot target model
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        # Enforce structured json output configuration
        generation_config = {
            "response_mime_type": "application/json",
            "temperature": 0.1  # Low temperature for extraction accuracy
        }

        # Perform call
        response = model.generate_content(
            prompt,
            generation_config=generation_config
        )

        try:
            parsed_json = json.loads(response.text)
            
            # Wrap in list if a single dictionary is returned
            if isinstance(parsed_json, dict):
                parsed_json = [parsed_json]
                
            facts = []
            for item in parsed_json:
                action = item.get("action", "").strip()
                metric_result = item.get("metric_result")
                status = item.get("status", "new").strip().lower()
                if status not in ["new", "update"]:
                    status = "new"

                # Parse fact UUID if status is an update
                fact_id = item.get("id")
                uuid_id = None
                if fact_id and status == "update":
                    try:
                        uuid_id = UUID(str(fact_id))
                    except ValueError:
                        uuid_id = None

                # Cleanup metric outcome representation
                if not metric_result or str(metric_result).strip() == "":
                    metric_result = None
                else:
                    metric_result = str(metric_result).strip()
                
                skills = item.get("skills", [])
                if not isinstance(skills, list):
                    skills = [str(skills)] if skills else []
                
                # Sanitize list values
                skills = [str(s).strip() for s in skills if s]

                if action:
                    fact = AtomicFactMerge(
                        id=uuid_id,
                        action=action,
                        metric_result=metric_result,
                        skills=skills,
                        status=status
                    )
                    facts.append(fact)
            return facts
        except Exception as e:
            raise RuntimeError(
                f"Failed to parse Gemini response as structured Atomic Facts: {e}. "
                f"Raw response was: {response.text if response else 'None'}"
            )


from app.domain.services import RelevanceRankingService
from app.domain.schemas import FactRankResult

class GeminiRelevanceRankingService(RelevanceRankingService):
    """Concrete implementation of RelevanceRankingService using the Google Gemini SDK."""

    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
        
        # Resolve prompt template path dynamically
        current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.prompt_template_path = os.path.join(current_dir, "core", "prompts", "relevance_ranking.txt")

    def _load_prompt_template(self) -> str:
        """Reads ranking instructions from disk."""
        with open(self.prompt_template_path, "r", encoding="utf-8") as f:
            return f.read()

    def rank_facts(
        self,
        facts: List[AtomicFact],
        job_description: str,
        company_context: Optional[str] = None
    ) -> List[FactRankResult]:
        """
        Scores candidate facts against the target Job Description using Gemini semantic scoring.
        Returns a sorted list of FactRankResult objects.
        """
        if not facts:
            return []
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not configured.")

        # Format input facts list as a simple JSON array to reduce payload
        facts_payload_str = json.dumps([
            {
                "id": str(f.id),
                "action": f.action,
                "skills": f.skills
            } for f in facts
        ], indent=2)

        template = self._load_prompt_template()
        prompt = template.format(
            job_description=job_description,
            company_context=company_context or "None",
            atomic_facts=facts_payload_str
        )

        model = genai.GenerativeModel("gemini-2.5-flash")
        generation_config = {
            "response_mime_type": "application/json",
            "temperature": 0.1
        }

        response = model.generate_content(
            prompt,
            generation_config=generation_config
        )

        try:
            parsed_json = json.loads(response.text)
            if isinstance(parsed_json, dict):
                parsed_json = [parsed_json]

            # Construct fact lookup map
            fact_map = {str(f.id): f for f in facts}
            results = []

            for item in parsed_json:
                fact_id = str(item.get("id", "")).strip()
                score_val = item.get("score", 0.0)
                try:
                    score = float(score_val)
                except (ValueError, TypeError):
                    score = 0.0
                
                matched = item.get("matched_keywords", [])
                if not isinstance(matched, list):
                    matched = [str(matched)] if matched else []
                matched = [str(k).strip() for k in matched if k]

                if fact_id in fact_map:
                    results.append(
                        FactRankResult(
                            fact=fact_map[fact_id],
                            score=score,
                            matched_keywords=matched
                        )
                    )

            # Assign default 0.0 score to any input facts that Gemini missed in response
            scored_ids = {str(r.fact.id) for r in results}
            for fid, fact in fact_map.items():
                if fid not in scored_ids:
                    results.append(
                        FactRankResult(
                            fact=fact,
                            score=0.0,
                            matched_keywords=[]
                        )
                    )

            # Sort descending by score
            results.sort(key=lambda r: r.score, reverse=True)
            return results
        except Exception as e:
            raise RuntimeError(
                f"Failed to parse Gemini response as Relevance Ranking results: {e}. "
                f"Raw response was: {response.text if response else 'None'}"
            )


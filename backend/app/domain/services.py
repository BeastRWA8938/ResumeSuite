from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.schemas import AtomicFact, AtomicFactMerge, FactRankResult, ResumeSynthesisResponse

class FactExtractionService(ABC):
    """Abstract Interface for parsing raw paragraphs into structured Atomic Facts."""

    @abstractmethod
    def extract_facts(self, raw_description: str, existing_facts: List[AtomicFact] = []) -> List[AtomicFactMerge]:
        """
        Decomposes a raw unstructured text description into a list of Atomic Facts,
        matching against existing items to prevent duplicates and mark updates.
        """
        pass


class RelevanceRankingService(ABC):
    """Abstract Interface for ranking Atomic Facts against a target Job Description."""

    @abstractmethod
    def rank_facts(
        self,
        facts: List[AtomicFact],
        job_description: str,
        company_context: Optional[str] = None
    ) -> List[FactRankResult]:
        """
        Scores and ranks a list of atomic facts.
        Returns a sorted list of FactRankResult models in descending score order.
        """
        pass


class ResumeSynthesisService(ABC):
    """Abstract Interface for custom high-impact resume synthesis (bullets and skills)."""

    @abstractmethod
    def synthesize_resume_content(
        self,
        facts: List[AtomicFact],
        all_skills: List[str],
        job_description: str,
        company_context: str
    ) -> ResumeSynthesisResponse:
        """
        Synthesizes selected accomplishments into high-impact bullet points (STAR / Google XYZ),
        and prioritizes/categorizes skills into prioritized matching categories.
        """
        pass

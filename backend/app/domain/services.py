from abc import ABC, abstractmethod
from typing import List
from app.domain.schemas import AtomicFact, AtomicFactMerge

class FactExtractionService(ABC):
    """Abstract Interface for parsing raw paragraphs into structured Atomic Facts."""

    @abstractmethod
    def extract_facts(self, raw_description: str, existing_facts: List[AtomicFact] = []) -> List[AtomicFactMerge]:
        """
        Decomposes a raw unstructured text description into a list of Atomic Facts,
        matching against existing items to prevent duplicates and mark updates.
        """
        pass

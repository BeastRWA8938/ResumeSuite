from abc import ABC, abstractmethod
from typing import List
from app.domain.schemas import AtomicFactCreate

class FactExtractionService(ABC):
    """Abstract Interface for parsing raw paragraphs into structured Atomic Facts."""

    @abstractmethod
    def extract_facts(self, raw_description: str) -> List[AtomicFactCreate]:
        """
        Decomposes a raw unstructured text description into a list of Atomic Facts
        carrying action statements, metric outcomes, and lists of skills.
        """
        pass

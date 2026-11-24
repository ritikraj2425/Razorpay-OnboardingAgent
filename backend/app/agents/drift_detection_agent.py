from app.agents.base import BaseAgent
from app.services.vector_diff_service import semantic_distance


class DriftDetectionAgent(BaseAgent):
    """
    Evaluates website content drift across temporal snapshots using
    bag-of-words token vectorization and cosine distance.
    Inherits from BaseAgent (OOP: Inheritance).
    """
    def __init__(self):
        super().__init__(
            name="DriftDetectionAgent",
            description="Calculates semantic distance between Day-0 snapshot and periodic crawls"
        )

    def _execute(self, baseline_text: str, current_text: str) -> float:
        return semantic_distance(baseline_text, current_text)


_instance = DriftDetectionAgent()

__all__ = ["DriftDetectionAgent", "semantic_distance"]

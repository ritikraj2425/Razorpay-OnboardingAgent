from abc import ABC, abstractmethod
from dataclasses import dataclass, field
import time
from typing import Any, Optional


@dataclass
class AgentResult:
    """Standardized output for all SentinelPay agent operations."""
    success: bool
    output: Any
    execution_time_ms: int
    error: Optional[str] = None
    metadata: dict[str, Any] = field(default_factory=dict)


class BaseAgent(ABC):
    """
    Abstract Base Class for all AI and rule-based verification agents.
    
    Demonstrates:
      - Abstraction: Defines the abstract contract for agent execution.
      - Template Method Pattern: 'run()' handles execution timing, error trapping,
        and telemetry, delegating domain logic to the abstract '_execute()' hook.
    """
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description

    def run(self, *args: Any, **kwargs: Any) -> AgentResult:
        """
        Template method: manages timing, execution lifecycle, and error wrapping.
        Subclasses implement '_execute' for domain-specific logic.
        """
        start_time = time.time()
        try:
            result = self._execute(*args, **kwargs)
            duration_ms = int((time.time() - start_time) * 1000)
            return AgentResult(
                success=True,
                output=result,
                execution_time_ms=duration_ms,
                metadata={"agent": self.name}
            )
        except Exception as exc:
            duration_ms = int((time.time() - start_time) * 1000)
            return AgentResult(
                success=False,
                output=None,
                execution_time_ms=duration_ms,
                error=str(exc),
                metadata={"agent": self.name}
            )

    @abstractmethod
    def _execute(self, *args: Any, **kwargs: Any) -> Any:
        """Subclasses must implement this abstract method with their specific verification logic."""
        pass

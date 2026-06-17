from abc import ABC, abstractmethod


class LLMProvider(ABC):
    @abstractmethod
    async def complete(self, system: str, messages: list[dict]) -> str:
        """Send messages to the LLM and return the text response."""
        ...

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable provider name for health checks."""
        ...

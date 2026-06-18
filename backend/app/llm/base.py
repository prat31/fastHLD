from abc import ABC, abstractmethod


class LLMProvider(ABC):
    @abstractmethod
    async def complete(self, system: str, messages: list[dict]) -> str:
        """Send messages to the LLM and return the text response."""
        ...

    async def complete_vision(
        self, system: str, text: str, image_b64: str, media_type: str
    ) -> str:
        """Send a text + image prompt to a vision-capable model and return the text response.

        Providers without vision support should not override this.
        """
        raise NotImplementedError(f"{self.name} does not support image input")

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable provider name for health checks."""
        ...

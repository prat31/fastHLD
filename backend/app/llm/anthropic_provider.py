import anthropic
from .base import LLMProvider


class AnthropicProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "claude-sonnet-4-6"):
        self._client = anthropic.AsyncAnthropic(api_key=api_key)
        self._model = model

    @property
    def name(self) -> str:
        return f"anthropic/{self._model}"

    async def complete(self, system: str, messages: list[dict]) -> str:
        response = await self._client.messages.create(
            model=self._model,
            max_tokens=2048,
            system=system,
            messages=messages,
        )
        return response.content[0].text

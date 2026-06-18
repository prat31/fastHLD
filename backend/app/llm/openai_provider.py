from openai import AsyncOpenAI
from .base import LLMProvider


class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "gpt-4o"):
        self._client = AsyncOpenAI(api_key=api_key)
        self._model = model

    @property
    def name(self) -> str:
        return f"openai/{self._model}"

    async def complete(self, system: str, messages: list[dict]) -> str:
        response = await self._client.chat.completions.create(
            model=self._model,
            messages=[{"role": "system", "content": system}] + messages,
            temperature=0.1,
        )
        return response.choices[0].message.content or ""

    async def complete_vision(
        self, system: str, text: str, image_b64: str, media_type: str
    ) -> str:
        response = await self._client.chat.completions.create(
            model=self._model,
            messages=[
                {"role": "system", "content": system},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": text},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:{media_type};base64,{image_b64}"},
                        },
                    ],
                },
            ],
            temperature=0.1,
        )
        return response.choices[0].message.content or ""

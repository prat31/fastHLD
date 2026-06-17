import httpx
from .base import LLMProvider


class OllamaProvider(LLMProvider):
    def __init__(self, base_url: str = "http://localhost:11434", model: str = "qwen2.5:7b"):
        self._base_url = base_url.rstrip("/")
        self._model = model

    @property
    def name(self) -> str:
        return f"ollama/{self._model}"

    async def complete(self, system: str, messages: list[dict]) -> str:
        payload = {
            "model": self._model,
            "messages": [{"role": "system", "content": system}] + messages,
            "stream": False,
            "options": {"temperature": 0.1},
        }
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(f"{self._base_url}/api/chat", json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["message"]["content"]

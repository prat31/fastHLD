import os
from .base import LLMProvider
from .ollama_provider import OllamaProvider
from .openai_provider import OpenAIProvider
from .anthropic_provider import AnthropicProvider


def get_provider() -> LLMProvider:
    provider = os.getenv("LLM_PROVIDER", "ollama").lower()
    if provider == "ollama":
        return OllamaProvider(
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            model=os.getenv("OLLAMA_MODEL", "qwen2.5:7b"),
        )
    elif provider == "openai":
        api_key = os.getenv("OPENAI_API_KEY", "")
        if not api_key:
            raise ValueError("OPENAI_API_KEY is required when LLM_PROVIDER=openai")
        return OpenAIProvider(
            api_key=api_key,
            model=os.getenv("OPENAI_MODEL", "gpt-4o"),
        )
    elif provider == "anthropic":
        api_key = os.getenv("ANTHROPIC_API_KEY", "")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY is required when LLM_PROVIDER=anthropic")
        return AnthropicProvider(
            api_key=api_key,
            model=os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
        )
    else:
        raise ValueError(f"Unknown LLM_PROVIDER: {provider!r}. Choose ollama | openai | anthropic")

from __future__ import annotations

import os
from .base import LLMProvider
from .ollama_provider import OllamaProvider
from .openai_provider import OpenAIProvider
from .anthropic_provider import AnthropicProvider


def get_vision_provider() -> LLMProvider | None:
    """A vision-capable provider, independent of LLM_PROVIDER.

    Prefers OpenAI (gpt-4o), then Anthropic (Claude). Returns None if neither
    API key is configured, since the default Ollama model cannot read images.
    """
    openai_key = os.getenv("OPENAI_API_KEY", "")
    if openai_key:
        return OpenAIProvider(
            api_key=openai_key,
            model=os.getenv("OPENAI_VISION_MODEL", os.getenv("OPENAI_MODEL", "gpt-4o")),
        )
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
    if anthropic_key:
        return AnthropicProvider(
            api_key=anthropic_key,
            model=os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
        )
    return None


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

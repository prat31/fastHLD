import json
import pytest
import respx
import httpx

from app.llm.ollama_provider import OllamaProvider


OLLAMA_RESPONSE = {
    "message": {
        "role": "assistant",
        "content": '[{"op": "add_node", "id": "n1", "type": "aws_ec2", "label": "Server", "x": 0, "y": 0}]'
    }
}


@pytest.mark.asyncio
@respx.mock
async def test_ollama_provider_calls_chat_endpoint():
    respx.post("http://localhost:11434/api/chat").mock(
        return_value=httpx.Response(200, json=OLLAMA_RESPONSE)
    )
    provider = OllamaProvider(base_url="http://localhost:11434", model="qwen2.5:7b")
    result = await provider.complete("system prompt", [{"role": "user", "content": "hello"}])
    assert "add_node" in result


@pytest.mark.asyncio
@respx.mock
async def test_ollama_provider_name():
    provider = OllamaProvider(model="llama3.1:8b")
    assert provider.name == "ollama/llama3.1:8b"


@pytest.mark.asyncio
@respx.mock
async def test_ollama_provider_passes_system_message():
    captured = {}

    def capture(request):
        captured["body"] = json.loads(request.content)
        return httpx.Response(200, json=OLLAMA_RESPONSE)

    respx.post("http://localhost:11434/api/chat").mock(side_effect=capture)
    provider = OllamaProvider()
    await provider.complete("MY SYSTEM PROMPT", [{"role": "user", "content": "test"}])
    messages = captured["body"]["messages"]
    assert messages[0]["role"] == "system"
    assert messages[0]["content"] == "MY SYSTEM PROMPT"


@pytest.mark.asyncio
@respx.mock
async def test_ollama_provider_raises_on_http_error():
    respx.post("http://localhost:11434/api/chat").mock(
        return_value=httpx.Response(500, text="Internal Server Error")
    )
    provider = OllamaProvider()
    with pytest.raises(httpx.HTTPStatusError):
        await provider.complete("sys", [{"role": "user", "content": "hi"}])

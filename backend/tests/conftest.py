import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.llm.base import LLMProvider


class MockLLMProvider(LLMProvider):
    def __init__(self, response: str = "[]"):
        self._response = response

    @property
    def name(self) -> str:
        return "mock/test"

    async def complete(self, system: str, messages: list[dict]) -> str:
        return self._response


@pytest.fixture
def mock_provider():
    return MockLLMProvider()


@pytest.fixture
async def client(mock_provider):
    app.state.llm_provider = mock_provider
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

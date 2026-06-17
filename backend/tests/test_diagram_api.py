import json
import pytest
from tests.conftest import MockLLMProvider
from app.main import app
from httpx import AsyncClient, ASGITransport


ADD_NODE_OP = json.dumps([
    {"op": "add_node", "id": "ec2-1", "type": "aws_ec2", "label": "Web Server", "x": 100, "y": 200}
])

ADD_EDGE_OP = json.dumps([
    {"op": "add_node", "id": "n1", "type": "generic_client_web", "label": "Client", "x": 50, "y": 100},
    {"op": "add_node", "id": "n2", "type": "aws_ec2", "label": "API", "x": 300, "y": 100},
    {"op": "add_edge", "id": "e1", "source": "n1", "target": "n2", "label": "HTTPS"},
])


@pytest.fixture
async def client_with(request):
    response_str = request.param if hasattr(request, "param") else "[]"
    app.state.llm_provider = MockLLMProvider(response_str)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


async def make_client(response_str: str):
    app.state.llm_provider = MockLLMProvider(response_str)
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


@pytest.mark.asyncio
async def test_health_endpoint():
    app.state.llm_provider = MockLLMProvider()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["provider"] == "mock/test"


@pytest.mark.asyncio
async def test_instruct_returns_add_node_op():
    app.state.llm_provider = MockLLMProvider(ADD_NODE_OP)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/api/diagram/instruct", json={
            "instruction": "Add an EC2 instance",
            "diagram_state": {"nodes": [], "edges": []}
        })
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["ops"]) == 1
    op = data["ops"][0]
    assert op["op"] == "add_node"
    assert op["id"] == "ec2-1"
    assert op["type"] == "aws_ec2"
    assert op["label"] == "Web Server"


@pytest.mark.asyncio
async def test_instruct_returns_multiple_ops():
    app.state.llm_provider = MockLLMProvider(ADD_EDGE_OP)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/api/diagram/instruct", json={
            "instruction": "Add a client connected to an API server",
            "diagram_state": {"nodes": [], "edges": []}
        })
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["ops"]) == 3
    ops_by_type = {op["op"] for op in data["ops"]}
    assert "add_node" in ops_by_type
    assert "add_edge" in ops_by_type


@pytest.mark.asyncio
async def test_instruct_handles_empty_ops():
    app.state.llm_provider = MockLLMProvider("[]")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/api/diagram/instruct", json={
            "instruction": "Do nothing",
            "diagram_state": {"nodes": [], "edges": []}
        })
    assert resp.status_code == 200
    assert resp.json()["ops"] == []


@pytest.mark.asyncio
async def test_instruct_handles_markdown_wrapped_json():
    wrapped = f"```json\n{ADD_NODE_OP}\n```"
    app.state.llm_provider = MockLLMProvider(wrapped)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/api/diagram/instruct", json={
            "instruction": "Add EC2",
            "diagram_state": {"nodes": [], "edges": []}
        })
    assert resp.status_code == 200
    assert len(resp.json()["ops"]) == 1


@pytest.mark.asyncio
async def test_instruct_422_on_invalid_json():
    app.state.llm_provider = MockLLMProvider("not json at all")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/api/diagram/instruct", json={
            "instruction": "Add something",
            "diagram_state": {"nodes": [], "edges": []}
        })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_instruct_skips_unknown_ops():
    ops_with_unknown = json.dumps([
        {"op": "unknown_op", "foo": "bar"},
        {"op": "add_node", "id": "n1", "type": "generic_server", "label": "Server", "x": 0, "y": 0},
    ])
    app.state.llm_provider = MockLLMProvider(ops_with_unknown)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/api/diagram/instruct", json={
            "instruction": "Test",
            "diagram_state": {"nodes": [], "edges": []}
        })
    assert resp.status_code == 200
    # Only the valid op is returned
    assert len(resp.json()["ops"]) == 1


@pytest.mark.asyncio
async def test_instruct_clear_op():
    app.state.llm_provider = MockLLMProvider(json.dumps([{"op": "clear"}]))
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/api/diagram/instruct", json={
            "instruction": "Clear the diagram",
            "diagram_state": {"nodes": [], "edges": []}
        })
    assert resp.status_code == 200
    assert resp.json()["ops"][0]["op"] == "clear"


@pytest.mark.asyncio
async def test_instruct_requires_non_empty_instruction():
    app.state.llm_provider = MockLLMProvider("[]")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/api/diagram/instruct", json={
            "instruction": "",
            "diagram_state": {"nodes": [], "edges": []}
        })
    assert resp.status_code == 422

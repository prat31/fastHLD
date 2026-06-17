import json
import pytest
from app.api.diagram import _extract_json, _parse_ops
from fastapi import HTTPException


def test_extract_json_bare_array():
    raw = '[{"op": "clear"}]'
    assert _extract_json(raw) == raw


def test_extract_json_with_markdown_fence():
    raw = '```json\n[{"op": "clear"}]\n```'
    assert _extract_json(raw) == '[{"op": "clear"}]'


def test_extract_json_with_plain_fence():
    raw = '```\n[{"op": "clear"}]\n```'
    assert _extract_json(raw) == '[{"op": "clear"}]'


def test_extract_json_strips_whitespace():
    raw = '  \n[{"op": "clear"}]  \n  '
    assert _extract_json(raw) == '[{"op": "clear"}]'


def test_parse_ops_add_node():
    raw = json.dumps([{"op": "add_node", "id": "n1", "type": "aws_ec2", "label": "EC2", "x": 0, "y": 0}])
    ops = _parse_ops(raw)
    assert len(ops) == 1
    assert ops[0].op == "add_node"
    assert ops[0].id == "n1"


def test_parse_ops_add_edge():
    raw = json.dumps([{"op": "add_edge", "id": "e1", "source": "n1", "target": "n2"}])
    ops = _parse_ops(raw)
    assert len(ops) == 1
    assert ops[0].op == "add_edge"


def test_parse_ops_remove_node():
    raw = json.dumps([{"op": "remove_node", "id": "n1"}])
    ops = _parse_ops(raw)
    assert ops[0].op == "remove_node"


def test_parse_ops_remove_edge():
    raw = json.dumps([{"op": "remove_edge", "id": "e1"}])
    ops = _parse_ops(raw)
    assert ops[0].op == "remove_edge"


def test_parse_ops_update_node():
    raw = json.dumps([{"op": "update_node", "id": "n1", "label": "New Label"}])
    ops = _parse_ops(raw)
    assert ops[0].op == "update_node"
    assert ops[0].label == "New Label"


def test_parse_ops_clear():
    raw = json.dumps([{"op": "clear"}])
    ops = _parse_ops(raw)
    assert ops[0].op == "clear"


def test_parse_ops_empty_array():
    ops = _parse_ops("[]")
    assert ops == []


def test_parse_ops_invalid_json_raises():
    with pytest.raises(HTTPException) as exc_info:
        _parse_ops("not json")
    assert exc_info.value.status_code == 422


def test_parse_ops_non_array_raises():
    with pytest.raises(HTTPException):
        _parse_ops('{"op": "clear"}')


def test_parse_ops_skips_unknown_op_types():
    raw = json.dumps([
        {"op": "teleport_node", "id": "x"},
        {"op": "clear"},
    ])
    ops = _parse_ops(raw)
    assert len(ops) == 1
    assert ops[0].op == "clear"


def test_parse_ops_with_markdown_fence():
    raw = "```json\n" + json.dumps([{"op": "clear"}]) + "\n```"
    ops = _parse_ops(raw)
    assert ops[0].op == "clear"


def test_parse_ops_multiple_ops():
    raw = json.dumps([
        {"op": "clear"},
        {"op": "add_node", "id": "n1", "type": "generic_server", "label": "Server", "x": 0, "y": 0},
        {"op": "add_node", "id": "n2", "type": "oss_postgres", "label": "DB", "x": 300, "y": 0},
        {"op": "add_edge", "id": "e1", "source": "n1", "target": "n2", "label": "SQL"},
    ])
    ops = _parse_ops(raw)
    assert len(ops) == 4

import json
import re
from fastapi import APIRouter, HTTPException, Request

from app.models.diagram import InstructRequest, InstructResponse, DiagramOp
from app.prompts.system_prompt import SYSTEM_PROMPT

router = APIRouter()


def _extract_json(text: str) -> str:
    """Strip markdown fences and whitespace to get bare JSON array."""
    text = text.strip()
    # Remove ```json ... ``` or ``` ... ```
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def _parse_ops(raw: str) -> list[DiagramOp]:
    try:
        cleaned = _extract_json(raw)
        data = json.loads(cleaned)
        if not isinstance(data, list):
            raise ValueError("Expected a JSON array")
        ops: list[DiagramOp] = []
        from app.models.diagram import (
            AddNodeOp, UpdateNodeOp, RemoveNodeOp, AddEdgeOp, RemoveEdgeOp, ClearOp
        )
        op_classes = {
            "add_node": AddNodeOp,
            "update_node": UpdateNodeOp,
            "remove_node": RemoveNodeOp,
            "add_edge": AddEdgeOp,
            "remove_edge": RemoveEdgeOp,
            "clear": ClearOp,
        }
        for item in data:
            op_type = item.get("op")
            op_cls = op_classes.get(op_type)
            if op_cls is not None:
                ops.append(op_cls(**item))
        return ops
    except (json.JSONDecodeError, ValueError, TypeError) as e:
        raise HTTPException(status_code=422, detail=f"LLM returned invalid JSON: {e}\n\nRaw: {raw[:500]}")


@router.post("/diagram/instruct", response_model=InstructResponse)
async def instruct(body: InstructRequest, request: Request):
    provider = request.app.state.llm_provider

    state_json = body.diagram_state.model_dump_json(indent=2)
    user_message = f"Current diagram state:\n{state_json}\n\nInstruction: {body.instruction}"

    raw = await provider.complete(
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    ops = _parse_ops(raw)
    return InstructResponse(ops=ops, raw=raw)

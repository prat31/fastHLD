import base64
import json
import re
from fastapi import APIRouter, File, HTTPException, Request, UploadFile

from app.models.diagram import InstructRequest, InstructResponse, DiagramOp
from app.prompts.system_prompt import SYSTEM_PROMPT, VISION_PROMPT
from app.llm.factory import get_vision_provider

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


@router.post("/diagram/parse-image", response_model=InstructResponse)
async def parse_image(file: UploadFile = File(...)):
    provider = get_vision_provider()
    if provider is None:
        raise HTTPException(
            status_code=503,
            detail="Image parsing requires a vision model. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.",
        )

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image upload")

    media_type = file.content_type or "image/png"
    image_b64 = base64.b64encode(image_bytes).decode("ascii")

    try:
        raw = await provider.complete_vision(
            system=VISION_PROMPT,
            text="Recreate this architecture diagram as diagram operations.",
            image_b64=image_b64,
            media_type=media_type,
        )
    except NotImplementedError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Image parsing failed: {exc}") from exc

    ops = _parse_ops(raw)
    return InstructResponse(ops=ops, raw=raw)

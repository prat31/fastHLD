from __future__ import annotations
from typing import Any, Literal, Optional, Union
from pydantic import BaseModel, Field


class NodePosition(BaseModel):
    x: float
    y: float


class DiagramNode(BaseModel):
    id: str
    type: str
    label: str
    position: NodePosition
    data: dict[str, Any] = Field(default_factory=dict)


class DiagramEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str = ""
    animated: bool = False


class DiagramState(BaseModel):
    nodes: list[DiagramNode] = Field(default_factory=list)
    edges: list[DiagramEdge] = Field(default_factory=list)


# --- Operations returned by LLM ---

class AddNodeOp(BaseModel):
    op: Literal["add_node"]
    id: str
    type: str
    label: str
    x: float = 100
    y: float = 100
    data: dict[str, Any] = Field(default_factory=dict)


class UpdateNodeOp(BaseModel):
    op: Literal["update_node"]
    id: str
    label: Optional[str] = None
    x: Optional[float] = None
    y: Optional[float] = None
    data: Optional[dict[str, Any]] = None


class RemoveNodeOp(BaseModel):
    op: Literal["remove_node"]
    id: str


class AddEdgeOp(BaseModel):
    op: Literal["add_edge"]
    id: str
    source: str
    target: str
    label: str = ""
    animated: bool = False


class RemoveEdgeOp(BaseModel):
    op: Literal["remove_edge"]
    id: str


class ClearOp(BaseModel):
    op: Literal["clear"]


DiagramOp = Union[AddNodeOp, UpdateNodeOp, RemoveNodeOp, AddEdgeOp, RemoveEdgeOp, ClearOp]


# --- API request/response ---

class InstructRequest(BaseModel):
    instruction: str = Field(..., min_length=1, max_length=2000)
    diagram_state: DiagramState = Field(default_factory=DiagramState)


class InstructResponse(BaseModel):
    ops: list[DiagramOp]
    raw: str = ""

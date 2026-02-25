from enum import Enum
from typing import Optional
from pydantic import BaseModel


class BlockType(str, Enum):
    role = "role"
    context = "context"
    objective = "objective"
    input = "input"
    constraints = "constraints"
    output_format = "output_format"
    examples = "examples"
    chain_of_thought = "chain_of_thought"
    language = "language"


class BlockData(BaseModel):
    type: BlockType
    label: str
    content: str
    description: str
    summary: str = ""


class Position(BaseModel):
    x: float
    y: float


class FlomptNode(BaseModel):
    id: str
    type: str = "block"
    position: Position
    data: BlockData


class FlomptEdge(BaseModel):
    id: str
    source: str
    target: str
    animated: bool = True


# ─── Request / Response ──────────────────────────────────────────────────────

class DecomposeRequest(BaseModel):
    prompt: str
    job_id: Optional[str] = None


class DecomposeResponse(BaseModel):
    nodes: list[FlomptNode]
    edges: list[FlomptEdge]


class CompileRequest(BaseModel):
    blocks: list[BlockData]


class CompiledPrompt(BaseModel):
    raw: str
    tokenEstimate: int
    blocks: list[BlockData]

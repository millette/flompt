"""
Decomposer Service

Analyse un prompt brut et retourne une liste de FlomptNodes + FlomptEdges.
Utilise l'AI service si disponible, sinon fallback sur la décomposition heuristique.
"""

import re
import uuid
from app.models.blocks import (
    BlockData, BlockType, FlomptNode, FlomptEdge,
    DecomposeResponse, Position
)
from typing import Optional
from app.services.ai_service import decompose_with_ai, _get_anthropic_key, _get_openai_key

BLOCK_META = {
    BlockType.role: {"label": "Role", "description": "Définit la persona / le rôle de l'IA"},
    BlockType.context: {"label": "Context", "description": "Fournit le contexte de la tâche"},
    BlockType.objective: {"label": "Objective", "description": "Ce qu'on veut accomplir"},
    BlockType.input: {"label": "Input", "description": "Données fournies à l'IA"},
    BlockType.constraints: {"label": "Constraints", "description": "Règles et limites à respecter"},
    BlockType.output_format: {"label": "Output Format", "description": "Format attendu de la réponse"},
    BlockType.examples: {"label": "Examples", "description": "Few-shot examples"},
    BlockType.chain_of_thought: {"label": "Chain of Thought", "description": "Étapes de raisonnement"},
    BlockType.language: {"label": "Language", "description": "Langue de réponse de l'IA"},
}

# Keywords heuristics for fallback
HEURISTIC_KEYWORDS: dict[BlockType, list[str]] = {
    BlockType.role: ["you are", "act as", "tu es", "agis comme", "your role"],
    BlockType.context: ["context", "background", "given that", "étant donné", "in this scenario"],
    BlockType.objective: ["your goal", "you must", "you should", "ton objectif", "you need to", "task:"],
    BlockType.input: ["input:", "data:", "the following", "voici", "here is"],
    BlockType.constraints: ["do not", "never", "always", "ne pas", "forbidden", "constraint", "rule:"],
    BlockType.output_format: ["output", "format", "return", "respond with", "retourne", "répondre en"],
    BlockType.examples: ["example", "for instance", "e.g.", "par exemple", "such as"],
    BlockType.chain_of_thought: ["step by step", "think", "reason", "étape", "raisonne", "chain of thought"],
    BlockType.language: ["in english", "in french", "en français", "en anglais", "respond in", "répondre en", "language:", "langue:"],
}


def _build_nodes_and_edges(raw_blocks: list[dict]) -> DecomposeResponse:
    """Convert raw block dicts to FlomptNodes and auto-link them."""
    nodes: list[FlomptNode] = []
    edges: list[FlomptEdge] = []

    x, y = 100.0, 50.0
    for i, block in enumerate(raw_blocks):
        block_type = BlockType(block["type"])
        meta = BLOCK_META[block_type]
        node_id = f"{block_type.value}-{uuid.uuid4().hex[:6]}"

        content = block.get("content", "")
        summary = block.get("summary", "")
        # Fallback: truncate content as summary if AI didn't provide one
        if not summary and content:
            summary = content[:40].strip()
            if len(content) > 40:
                summary += "…"

        nodes.append(FlomptNode(
            id=node_id,
            type="block",
            position=Position(x=x, y=y),
            data=BlockData(
                type=block_type,
                label=meta["label"],
                content=content,
                description=meta["description"],
                summary=summary,
            )
        ))

        if i > 0:
            edges.append(FlomptEdge(
                id=f"e{i-1}-{i}",
                source=nodes[i - 1].id,
                target=node_id,
                animated=True,
            ))

        y += 180.0

    return DecomposeResponse(nodes=nodes, edges=edges)


def _heuristic_decompose(raw_prompt: str) -> list[dict]:
    """Fallback: keyword-based decomposition."""
    lower = raw_prompt.lower()
    found: list[dict] = []

    # Default order
    ordered = [
        BlockType.role, BlockType.context, BlockType.objective,
        BlockType.input, BlockType.constraints, BlockType.output_format,
        BlockType.examples, BlockType.chain_of_thought, BlockType.language,
    ]

    for block_type in ordered:
        keywords = HEURISTIC_KEYWORDS[block_type]
        if any(kw in lower for kw in keywords):
            found.append({"type": block_type.value, "content": ""})

    # If nothing matched, just put everything in objective
    if not found:
        found = [{"type": BlockType.objective.value, "content": raw_prompt}]

    return found


async def decompose(raw_prompt: str, job_id: Optional[str] = None) -> DecomposeResponse:
    """Main entry point — AI if available, else heuristic."""
    ai_available = bool(_get_anthropic_key() or _get_openai_key())

    if ai_available:
        raw_blocks = await decompose_with_ai(raw_prompt, job_id=job_id)
    else:
        raw_blocks = _heuristic_decompose(raw_prompt)

    return _build_nodes_and_edges(raw_blocks)

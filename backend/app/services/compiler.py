"""
Compiler Service

Recompile une liste ordonnée de blocs en un prompt optimisé machine-readable.
Utilise l'AI service si disponible, sinon fallback sur la compilation structurée.
"""

from app.models.blocks import BlockData, BlockType, CompiledPrompt
from app.services.ai_service import compile_with_ai, ANTHROPIC_API_KEY, OPENAI_API_KEY

# Ordre canonique des blocs dans le prompt final
CANONICAL_ORDER: list[BlockType] = [
    BlockType.role,
    BlockType.context,
    BlockType.objective,
    BlockType.input,
    BlockType.constraints,
    BlockType.output_format,
    BlockType.examples,
    BlockType.chain_of_thought,
]

# Tags XML pour le format machine-readable
BLOCK_TAGS: dict[BlockType, str] = {
    BlockType.role: "role",
    BlockType.context: "ctx",
    BlockType.objective: "objective",
    BlockType.input: "input",
    BlockType.constraints: "constraints",
    BlockType.output_format: "format",
    BlockType.examples: "examples",
    BlockType.chain_of_thought: "cot",
}


def _estimate_tokens(text: str) -> int:
    """Estimation rapide : ~4 chars = 1 token."""
    return max(1, len(text) // 4)


def _structural_compile(blocks: list[BlockData]) -> str:
    """
    Fallback : compile les blocs en XML structuré machine-readable.
    Tri selon l'ordre canonique, ignore les blocs vides.
    """
    # Trier selon l'ordre canonique
    ordered = sorted(
        [b for b in blocks if b.content.strip()],
        key=lambda b: CANONICAL_ORDER.index(b.type) if b.type in CANONICAL_ORDER else 99
    )

    parts: list[str] = []
    for block in ordered:
        tag = BLOCK_TAGS.get(block.type, block.type.value)
        content = block.content.strip()
        parts.append(f"<{tag}>{content}</{tag}>")

    return "\n".join(parts)


async def compile(blocks: list[BlockData]) -> CompiledPrompt:
    """Main entry point — AI si disponible, sinon structurel."""
    ai_available = bool(ANTHROPIC_API_KEY or OPENAI_API_KEY)

    if ai_available:
        optimized = await compile_with_ai([b.model_dump() for b in blocks])
    else:
        optimized = _structural_compile(blocks)

    return CompiledPrompt(
        raw=optimized,
        tokenEstimate=_estimate_tokens(optimized),
        blocks=blocks,
    )

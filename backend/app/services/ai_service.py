"""
AI Service — Placeholder pour l'intégration LLM.

À brancher : Anthropic API (claude-3-5-haiku) ou OpenAI (gpt-4o-mini)
pour la décomposition et la recompilation des prompts.

Usage futur :
    from anthropic import Anthropic
    client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
"""

import os
from typing import Optional

# ─── Config ──────────────────────────────────────────────────────────────────

ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY")
OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")

AI_PROVIDER = os.getenv("AI_PROVIDER", "anthropic")  # "anthropic" | "openai"
AI_MODEL = os.getenv("AI_MODEL", "claude-3-5-haiku-20241022")


# ─── System Prompts ───────────────────────────────────────────────────────────

DECOMPOSE_SYSTEM_PROMPT = """
You are a prompt analysis expert. Your task is to decompose a raw user prompt
into structured logical blocks following this taxonomy:

- role: The AI persona/role
- context: Background information and context
- objective: The main goal to achieve
- input: Data provided to the AI
- constraints: Rules, limits, and restrictions
- output_format: Expected response format
- examples: Few-shot examples
- chain_of_thought: Reasoning steps

Return a JSON object with:
{
  "blocks": [
    { "type": "<block_type>", "content": "<extracted content>" }
  ]
}

Only include blocks that are present in the prompt.
Preserve the original intent. Do not paraphrase excessively.
""".strip()

COMPILE_SYSTEM_PROMPT = """
You are a prompt optimization expert. Your task is to recompile a set of
structured blocks into a single optimized, machine-readable prompt.

Rules:
- Be maximally concise — remove all filler words
- Use structured syntax (XML tags, JSON, or labeled sections)
- Preserve ALL semantic meaning and constraints
- Optimize for AI-to-AI consumption, not human readability
- Minimize token count without losing information

Return a JSON object: { "prompt": "<optimized prompt>" }
""".strip()


# ─── Stub functions (to be implemented) ──────────────────────────────────────

async def decompose_with_ai(raw_prompt: str) -> list[dict]:
    """
    TODO: Appeler le LLM pour décomposer le prompt en blocs.

    Expected return:
        [{"type": "role", "content": "..."}, ...]
    """
    raise NotImplementedError("AI provider not configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.")


async def compile_with_ai(blocks: list[dict]) -> str:
    """
    TODO: Appeler le LLM pour recompiler les blocs en prompt optimisé.

    Expected return:
        "<optimized machine-readable prompt>"
    """
    raise NotImplementedError("AI provider not configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.")

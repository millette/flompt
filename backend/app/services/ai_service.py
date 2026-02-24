"""
AI Service — Intégration LLM via httpx (pas de SDK requis).
Supporte Anthropic (claude-3-5-haiku) et OpenAI (gpt-4o-mini).
"""

import os
import json
import httpx
from typing import Optional

# ─── Config ──────────────────────────────────────────────────────────────────

ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY")
OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")

AI_PROVIDER = os.getenv("AI_PROVIDER", "anthropic")
AI_MODEL = os.getenv("AI_MODEL", "claude-3-5-haiku-20241022")

TIMEOUT = 30.0

# ─── System Prompts ───────────────────────────────────────────────────────────

DECOMPOSE_SYSTEM_PROMPT = """You are a prompt analysis expert. Decompose the user's prompt into structured blocks.

Block types available:
- role: The AI persona/role (who the AI should be)
- context: Background information and situational context
- objective: The main goal or task to accomplish
- input: Data or variables provided to the AI
- constraints: Rules, restrictions, and limits
- output_format: Expected response format and structure
- examples: Few-shot examples (input/output pairs)
- chain_of_thought: Explicit reasoning steps required

Return ONLY valid JSON, no markdown:
{"blocks": [{"type": "<type>", "content": "<extracted content verbatim>"}]}

Rules:
- Only include blocks that are clearly present
- Extract content verbatim from the prompt
- Minimum 1 block, maximum 8 blocks
- If unclear, default to objective"""

COMPILE_SYSTEM_PROMPT = """You are a prompt optimization expert. Recompile structured blocks into a single optimized prompt.

Rules:
- Be maximally concise — remove all filler words
- Use XML-style tags for structure: <role>, <context>, <objective>, etc.
- Preserve ALL semantic meaning and constraints
- Optimize for AI-to-AI consumption
- No preamble, no explanation — just the prompt

Return ONLY valid JSON: {"prompt": "<optimized prompt>"}"""


# ─── Anthropic ────────────────────────────────────────────────────────────────

async def _call_anthropic(system: str, user: str) -> str:
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": AI_MODEL,
                "max_tokens": 1024,
                "system": system,
                "messages": [{"role": "user", "content": user}],
            }
        )
        resp.raise_for_status()
        return resp.json()["content"][0]["text"]


# ─── OpenAI ───────────────────────────────────────────────────────────────────

async def _call_openai(system: str, user: str) -> str:
    model = os.getenv("AI_MODEL", "gpt-4o-mini")
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "max_tokens": 1024,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                "response_format": {"type": "json_object"},
            }
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


# ─── Dispatcher ───────────────────────────────────────────────────────────────

async def _call_llm(system: str, user: str) -> str:
    if ANTHROPIC_API_KEY and AI_PROVIDER == "anthropic":
        return await _call_anthropic(system, user)
    elif OPENAI_API_KEY:
        return await _call_openai(system, user)
    raise RuntimeError("No API key configured (ANTHROPIC_API_KEY or OPENAI_API_KEY)")


# ─── Public API ───────────────────────────────────────────────────────────────

async def decompose_with_ai(raw_prompt: str) -> list[dict]:
    """Décompose un prompt brut en blocs structurés via LLM."""
    raw = await _call_llm(DECOMPOSE_SYSTEM_PROMPT, raw_prompt)
    data = json.loads(raw)
    return data.get("blocks", [])


async def compile_with_ai(blocks: list[dict]) -> str:
    """Recompile des blocs en prompt optimisé via LLM."""
    blocks_text = "\n".join(f"[{b['type'].upper()}]\n{b['content']}" for b in blocks if b.get('content'))
    raw = await _call_llm(COMPILE_SYSTEM_PROMPT, blocks_text)
    data = json.loads(raw)
    return data.get("prompt", "")

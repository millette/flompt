"""
AI Service — Intégration LLM via httpx (pas de SDK requis).
Supporte Anthropic (claude-3-5-haiku) et OpenAI (gpt-4o-mini).
"""

import os
import json
import httpx
from typing import Optional

# ─── Config (lazy getters — read at call time, not import time) ──────────────

def _get_anthropic_key() -> Optional[str]:
    return os.getenv("ANTHROPIC_API_KEY")

def _get_openai_key() -> Optional[str]:
    return os.getenv("OPENAI_API_KEY")

def _get_provider() -> str:
    return os.getenv("AI_PROVIDER", "anthropic")

def _get_model() -> str:
    return os.getenv("AI_MODEL", "claude-sonnet-4-20250514")

TIMEOUT = 30.0


def _strip_markdown_json(text: str) -> str:
    """Strip markdown code fences (```json ... ```) from LLM response."""
    text = text.strip()
    if text.startswith("```"):
        # Remove opening fence (```json or ```)
        first_newline = text.index("\n")
        text = text[first_newline + 1:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

# ─── System Prompts ───────────────────────────────────────────────────────────

DECOMPOSE_SYSTEM_PROMPT = """You are a prompt engineering expert. Analyze the user's prompt and BUILD a structured workflow by decomposing it into logical blocks.

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
{"blocks": [{"type": "<type>", "content": "<detailed content>", "summary": "<2-5 word label>"}]}

Rules:
- CONSTRUCT a proper workflow, don't just split text — rewrite each block with clear, actionable content
- The "summary" field is a very short label (2-5 words max) that summarizes the block at a glance (e.g. "Expert marketing digital", "Bullet points JSON", "Max 200 mots")
- Write content and summary in the SAME language as the user's prompt
- Only include blocks that are semantically present or implied
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
                "x-api-key": _get_anthropic_key(),
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": _get_model(),
                "max_tokens": 1024,
                "system": system,
                "messages": [{"role": "user", "content": user}],
            }
        )
        resp.raise_for_status()
        return resp.json()["content"][0]["text"]


# ─── OpenAI ───────────────────────────────────────────────────────────────────

async def _call_openai(system: str, user: str) -> str:
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {_get_openai_key()}",
                "Content-Type": "application/json",
            },
            json={
                "model": _get_model(),
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
    if _get_anthropic_key() and _get_provider() == "anthropic":
        return await _call_anthropic(system, user)
    elif _get_openai_key():
        return await _call_openai(system, user)
    raise RuntimeError("No API key configured (ANTHROPIC_API_KEY or OPENAI_API_KEY)")


# ─── Public API ───────────────────────────────────────────────────────────────

async def decompose_with_ai(raw_prompt: str) -> list[dict]:
    """Décompose un prompt brut en blocs structurés via LLM."""
    raw = await _call_llm(DECOMPOSE_SYSTEM_PROMPT, raw_prompt)
    data = json.loads(_strip_markdown_json(raw))
    return data.get("blocks", [])


async def compile_with_ai(blocks: list[dict]) -> str:
    """Recompile des blocs en prompt optimisé via LLM."""
    blocks_text = "\n".join(f"[{b['type'].upper()}]\n{b['content']}" for b in blocks if b.get('content'))
    raw = await _call_llm(COMPILE_SYSTEM_PROMPT, blocks_text)
    data = json.loads(_strip_markdown_json(raw))
    return data.get("prompt", "")

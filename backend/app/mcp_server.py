"""
flompt MCP Server

Exposes flompt capabilities as MCP tools for Claude Code.
Transport: Streamable HTTP via FastMCP

Claude Code config:
  claude mcp add --transport http --scope user flompt https://flompt.dev/mcp/

  or ~/.claude.json:
  {
    "mcpServers": {
      "flompt": {
        "type": "http",
        "url": "https://flompt.dev/mcp/"
      }
    }
  }
"""

import json
from mcp.server.fastmcp import FastMCP
from mcp.server.transport_security import TransportSecuritySettings
from app.services.decomposer import decompose
from app.services.compiler import compile as compile_blocks
from app.models.blocks import BlockData, BlockType

# ─── MCP Server ───────────────────────────────────────────────────────────────
# streamable_http_path="/" + mounted on /mcp in FastAPI → accessible at /mcp/
# stateless_http=True: each call is independent, no persistent session

mcp = FastMCP(
    "flompt",
    instructions=(
        "flompt is a Visual AI Prompt Builder. "
        "Use it to decompose raw prompts into structured blocks "
        "(role, objective, constraints, etc.) and compile them into Claude-optimized XML. "
        "Typical workflow: decompose_prompt → edit blocks → compile_prompt."
    ),
    streamable_http_path="/",
    stateless_http=True,
    # DNS rebinding protection: allow flompt.dev (via Caddy) + localhost for dev
    transport_security=TransportSecuritySettings(
        enable_dns_rebinding_protection=True,
        allowed_hosts=["flompt.dev", "127.0.0.1:*", "localhost:*", "[::1]:*"],
        allowed_origins=[
            "https://flompt.dev",
            "http://localhost:*",
            "http://127.0.0.1:*",
        ],
    ),
)

# ─── Tool: decompose_prompt ───────────────────────────────────────────────────

@mcp.tool()
async def decompose_prompt(prompt: str) -> str:
    """
    Decompose a raw prompt into structured blocks (role, objective, context, constraints, etc.).

    Uses AI (Claude/OpenAI) if an API key is configured on the server, otherwise
    falls back to keyword-based heuristic analysis.
    Returns a JSON list of blocks ready to edit or pass to compile_prompt.

    Args:
        prompt: The raw prompt string to decompose.

    Returns:
        A summary of extracted blocks + the full JSON to pass to compile_prompt.
    """
    result = await decompose(prompt)

    blocks_out = []
    for node in result.nodes:
        blocks_out.append({
            "id": node.id,
            "type": node.data.type.value,
            "label": node.data.label,
            "content": node.data.content,
            "description": node.data.description,
            "summary": node.data.summary,
        })

    summary_lines = [f"✅ {len(blocks_out)} blocks extracted:\n"]
    for b in blocks_out:
        preview = b["content"][:80].replace("\n", " ")
        if len(b["content"]) > 80:
            preview += "…"
        summary_lines.append(f"  [{b['type'].upper()}] {preview}")

    summary_lines.append(
        f"\n📋 Full blocks JSON (pass this to compile_prompt):\n"
        f"{json.dumps(blocks_out, ensure_ascii=False, indent=2)}"
    )

    return "\n".join(summary_lines)


# ─── Tool: compile_prompt ─────────────────────────────────────────────────────

@mcp.tool()
async def compile_prompt(blocks_json: str) -> str:
    """
    Compile a list of blocks into a Claude-optimized structured XML prompt.

    Takes the JSON returned by decompose_prompt (or manually crafted blocks)
    and produces a ready-to-use XML prompt with a token estimate.

    Args:
        blocks_json: JSON-stringified list of blocks.
                     Each block: {"type": "role|objective|...", "content": "...",
                                  "label": "...", "description": "...", "summary": ""}

    Returns:
        The compiled XML prompt with token estimate.
    """
    try:
        raw = json.loads(blocks_json)
    except json.JSONDecodeError as e:
        return f"❌ Invalid JSON: {e}\n\nMake sure to pass a valid JSON string."

    blocks: list[BlockData] = []
    errors: list[str] = []
    valid_types = {t.value for t in BlockType}

    for i, b in enumerate(raw):
        block_type = b.get("type", "")
        if block_type not in valid_types:
            errors.append(
                f"Block #{i}: invalid type '{block_type}'. "
                f"Valid types: {', '.join(sorted(valid_types))}"
            )
            continue
        blocks.append(BlockData(
            type=BlockType(block_type),
            label=b.get("label", block_type.replace("_", " ").title()),
            content=b.get("content", ""),
            description=b.get("description", ""),
            summary=b.get("summary", ""),
        ))

    if errors:
        return "❌ Block errors:\n" + "\n".join(f"  - {e}" for e in errors)

    if not blocks:
        return "❌ No valid blocks provided."

    result = await compile_blocks(blocks)

    return (
        f"✅ Prompt compiled ({result.tokenEstimate} estimated tokens):\n\n"
        f"{result.raw}"
    )


# ─── Tool: list_block_types ───────────────────────────────────────────────────

@mcp.tool()
def list_block_types() -> str:
    """
    List all available block types in flompt with their descriptions.

    Useful to know which types to use when manually crafting blocks
    to pass to compile_prompt.

    Returns:
        Description of each block type and the recommended canonical ordering.
    """
    BLOCK_DESCRIPTIONS = {
        "role":             "AI persona (e.g. 'You are a senior Python developer')",
        "context":          "Background information or situational context",
        "objective":        "Main task / what you want to accomplish",
        "input":            "Data or content provided to the AI for processing",
        "document":         "External content injected as XML grounding (<document index='N'>)",
        "constraints":      "Rules, limits and restrictions",
        "output_format":    "Expected response format (JSON, Markdown, list…)",
        "format_control":   "Claude style directives (tone, verbosity, markdown on/off)",
        "examples":         "Few-shot input/output pairs to guide the AI",
        "chain_of_thought": "Step-by-step reasoning instructions",
        "language":         "Expected output language",
    }

    lines = ["📦 Available flompt block types:\n"]
    for btype, desc in BLOCK_DESCRIPTIONS.items():
        lines.append(f"  • {btype:<20} — {desc}")

    lines.append(
        "\n💡 Recommended order (Claude best practices):\n"
        "  document → role → context → objective → input → "
        "constraints → examples → chain_of_thought → output_format → format_control → language"
    )

    return "\n".join(lines)

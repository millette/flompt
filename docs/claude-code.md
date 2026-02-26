# Claude Code Integration (MCP)

flompt exposes a native **MCP server** (Model Context Protocol) hosted on `flompt.dev`. Add it once to Claude Code — no install, no account, no API key.

---

## Setup

Add the following to your project's `.mcp.json` (or your global `~/.claude.json`):

```json
{
  "mcpServers": {
    "flompt": {
      "type": "http",
      "url": "https://flompt.dev/mcp/"
    }
  }
}
```

Or use the interactive command inside Claude Code:

```
/mcp add
```

Then enter `https://flompt.dev/mcp/` as the URL.

---

## Available Tools

### `decompose_prompt`

Decomposes a raw prompt string into structured blocks.

**Input:**
- `prompt` (string) — the raw prompt to analyze

**Output:** A formatted list of blocks + the full JSON ready to pass to `compile_prompt`.

**Example:**
```
decompose_prompt("You are a senior Python developer. Review the following code for bugs. Be concise and prioritize critical issues.")
```

Returns blocks like `role`, `objective`, `constraints`, each with content and metadata.

---

### `compile_prompt`

Compiles a list of blocks into a Claude-optimized XML prompt.

**Input:**
- `blocks_json` (string) — JSON array of blocks (output from `decompose_prompt`, or manually crafted)

**Output:** The compiled XML prompt with token estimate.

**Example:**
```json
[
  { "type": "role",        "label": "Role",        "content": "You are a senior Python developer.", "description": "...", "summary": "" },
  { "type": "objective",   "label": "Objective",   "content": "Review the code for bugs.",          "description": "...", "summary": "" },
  { "type": "constraints", "label": "Constraints", "content": "Be concise. Flag critical issues.",   "description": "...", "summary": "" }
]
```

---

### `list_block_types`

Returns all 11 block types with descriptions and the recommended canonical order.

**No input required.**

| Block type | Description |
|---|---|
| `role` | Persona / who the AI is |
| `context` | Background info |
| `objective` | Main task |
| `input` | Data to process |
| `document` | External content (XML grounding) |
| `constraints` | Rules and limits |
| `output_format` | Expected response format |
| `format_control` | Claude style directives (markdown, verbosity…) |
| `examples` | Few-shot input/output pairs |
| `chain_of_thought` | Step-by-step reasoning instructions |
| `language` | Output language |

---

## Typical Workflow in Claude Code

```
1. User provides a rough prompt idea
2. Claude calls decompose_prompt → gets structured blocks
3. Claude adjusts the blocks (add constraints, refine objective…)
4. Claude calls compile_prompt → gets the final XML
5. Claude uses the XML directly in its next task
```

---

## Notes

- The MCP server is **stateless** — each call is independent.
- The `decompose_prompt` tool uses the same AI backend as the web app (Claude/OpenAI if an API key is configured on the server, heuristic fallback otherwise).
- The `compile_prompt` tool runs **locally on the server** — no LLM call, instant.
- No authentication required.
- Source: [`backend/app/mcp_server.py`](https://github.com/Nyrok/flompt)

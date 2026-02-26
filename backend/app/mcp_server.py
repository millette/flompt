"""
flompt MCP Server

Expose les fonctionnalités de flompt comme outils MCP pour Claude Code.
Transport: Streamable HTTP (standard moderne) via FastMCP

Config Claude Code (.mcp.json) :
  {
    "mcpServers": {
      "flompt": {
        "type": "http",
        "url": "https://flompt.dev/mcp"
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

# ─── Serveur MCP ─────────────────────────────────────────────────────────────
# streamable_http_path="/" + monté sur /mcp dans FastAPI → accessible en /mcp
# stateless_http=True : chaque appel est indépendant, pas de session persistante

mcp = FastMCP(
    "flompt",
    instructions=(
        "flompt est un Visual AI Prompt Builder. "
        "Utilise-le pour décomposer des prompts bruts en blocs structurés "
        "(role, objective, constraints, etc.) et les compiler en XML optimisé pour Claude. "
        "Workflow typique : decompose_prompt → édition manuelle → compile_prompt."
    ),
    streamable_http_path="/",
    stateless_http=True,
    # DNS rebinding protection : autorise flompt.dev + localhost dev
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
    Décompose un prompt brut en blocs structurés (role, objective, context, constraints, etc.).

    Utilise l'IA (Claude/OpenAI) si une clé API est configurée, sinon analyse heuristique.
    Retourne un JSON avec les blocs prêts à être édités ou compilés.

    Args:
        prompt: Le prompt brut à décomposer.

    Returns:
        JSON stringifié avec la liste des blocs et leurs contenus.
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

    summary_lines = [f"✅ {len(blocks_out)} blocs extraits :\n"]
    for b in blocks_out:
        preview = b["content"][:80].replace("\n", " ")
        if len(b["content"]) > 80:
            preview += "…"
        summary_lines.append(f"  [{b['type'].upper()}] {preview}")

    summary_lines.append(
        f"\n📋 JSON complet des blocs (à passer à compile_prompt) :\n"
        f"{json.dumps(blocks_out, ensure_ascii=False, indent=2)}"
    )

    return "\n".join(summary_lines)


# ─── Tool: compile_prompt ─────────────────────────────────────────────────────

@mcp.tool()
async def compile_prompt(blocks_json: str) -> str:
    """
    Compile une liste de blocs en prompt XML structuré optimisé pour Claude.

    Prend le JSON retourné par decompose_prompt (ou modifié manuellement),
    et produit un prompt XML prêt à l'emploi avec estimation de tokens.

    Args:
        blocks_json: JSON stringifié d'une liste de blocs.
                     Chaque bloc : {"type": "role|objective|...", "content": "...",
                                    "label": "...", "description": "...", "summary": ""}

    Returns:
        Le prompt XML compilé avec l'estimation de tokens.
    """
    try:
        raw = json.loads(blocks_json)
    except json.JSONDecodeError as e:
        return f"❌ Erreur JSON : {e}\n\nAssure-toi de passer un JSON valide."

    blocks: list[BlockData] = []
    errors: list[str] = []
    valid_types = {t.value for t in BlockType}

    for i, b in enumerate(raw):
        block_type = b.get("type", "")
        if block_type not in valid_types:
            errors.append(
                f"Bloc #{i}: type '{block_type}' invalide. "
                f"Types valides : {', '.join(sorted(valid_types))}"
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
        return "❌ Erreurs dans les blocs :\n" + "\n".join(f"  - {e}" for e in errors)

    if not blocks:
        return "❌ Aucun bloc valide fourni."

    result = await compile_blocks(blocks)

    return (
        f"✅ Prompt compilé ({result.tokenEstimate} tokens estimés) :\n\n"
        f"{result.raw}"
    )


# ─── Tool: list_block_types ───────────────────────────────────────────────────

@mcp.tool()
def list_block_types() -> str:
    """
    Liste tous les types de blocs disponibles dans flompt avec leur description.

    Utile pour savoir quels types utiliser lors de la création manuelle de blocs
    à passer à compile_prompt.

    Returns:
        Description textuelle de chaque type de bloc.
    """
    BLOCK_DESCRIPTIONS = {
        "role":            "Persona / rôle de l'IA (ex: 'Tu es un expert Python senior')",
        "context":         "Contexte de la tâche ou de la situation",
        "objective":       "Tâche principale / ce qu'on veut accomplir",
        "input":           "Données fournies à l'IA pour traitement",
        "document":        "Contenu externe injecté en XML grounding (<document index='N'>)",
        "constraints":     "Règles, limites et interdictions",
        "output_format":   "Format attendu de la réponse (JSON, Markdown, liste...)",
        "format_control":  "Directives de style Claude (ton, verbosité, markdown on/off)",
        "examples":        "Few-shot input/output pairs pour guider l'IA",
        "chain_of_thought":"Instructions de raisonnement étape par étape",
        "language":        "Langue de la réponse attendue",
    }

    lines = ["📦 Types de blocs flompt disponibles :\n"]
    for btype, desc in BLOCK_DESCRIPTIONS.items():
        lines.append(f"  • {btype:<20} — {desc}")

    lines.append(
        "\n💡 Ordre recommandé (Claude best practices) :\n"
        "  document → role → context → objective → input → "
        "constraints → examples → chain_of_thought → output_format → format_control → language"
    )

    return "\n".join(lines)

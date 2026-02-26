from dotenv import load_dotenv
load_dotenv()  # MUST be called before any import that reads env vars

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import decompose, compile
from app.services.ai_service import llm_queue
from app.services.job_store import job_store
from app.mcp_server import mcp

# Créer l'app streamable HTTP et son session manager avant le lifespan
_mcp_http_app = mcp.streamable_http_app()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Démarre le session manager MCP au boot et le stoppe proprement."""
    async with mcp.session_manager.run():
        yield


app = FastAPI(
    title="flompt API",
    description="Visual Prompt Builder — decompose, edit, recompile.",
    version="0.1.0",
    lifespan=lifespan,
)

# ─── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://flompt.dev", "http://flompt.dev"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ─────────────────────────────────────────────────────────────────
app.include_router(decompose.router, prefix="/api", tags=["decompose"])
app.include_router(compile.router, prefix="/api", tags=["compile"])

# ─── MCP Server (Streamable HTTP, stateless) ─────────────────────────────────
# Endpoint : POST /mcp  (streamable HTTP, standard moderne Claude Code)
# Config Claude Code : { "mcpServers": { "flompt": { "type": "http", "url": "https://flompt.dev/mcp" } } }
# streamable_http_path="/" dans FastMCP + mount sur /mcp → route finale = /mcp
app.mount("/mcp", _mcp_http_app)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "flompt-api"}


@app.get("/api/queue/status")
async def queue_status() -> dict:
    """Monitoring global de la queue LLM."""
    return {"status": "ok", **llm_queue.status}


@app.get("/api/queue/job/{job_id}")
async def queue_job_status(job_id: str) -> dict:
    """
    Statut et résultat d'un job par son ID. Priorité : queue live > job store.

    - status=queued     → en attente, position=N (live depuis la queue)
    - status=processing → en cours de traitement (live depuis la queue)
    - status=done       → terminé, result={nodes, edges} disponible
    - status=error      → erreur, error="..." disponible
    - status=unknown    → job inconnu (jamais soumis ou expiré)
    """
    # Statut live de la LLMQueue (position exacte, processing en cours)
    live = llm_queue.get_job_status(job_id)
    if live:
        return live

    # Résultat/erreur stocké dans le job store (done/error/queued pré-enregistré)
    stored = job_store.get(job_id)
    if stored:
        return {"job_id": job_id, **stored}

    return {"job_id": job_id, "status": "unknown"}

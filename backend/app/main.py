from dotenv import load_dotenv
load_dotenv()  # MUST be called before any import that reads env vars

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import decompose, compile

app = FastAPI(
    title="flompt API",
    description="Visual Prompt Builder — decompose, edit, recompile.",
    version="0.1.0",
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


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "flompt-api"}

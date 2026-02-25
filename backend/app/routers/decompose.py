import asyncio
import uuid

from fastapi import APIRouter, HTTPException
from app.models.blocks import DecomposeRequest
from app.services.decomposer import decompose
from app.services.job_store import job_store
from app.services.ai_service import llm_queue

router = APIRouter()


async def _decompose_task(job_id: str, prompt: str) -> None:
    """Background task — traverse la LLMQueue puis stocke le résultat."""
    try:
        result = await decompose(prompt, job_id=job_id)
        job_store.store_result(job_id, result.dict())
    except Exception as e:
        job_store.store_error(job_id, str(e))


@router.post("/decompose")
async def decompose_prompt(body: DecomposeRequest) -> dict:
    """
    Soumet un job de décomposition de façon asynchrone (fire-and-forget).

    Retourne immédiatement { job_id, status, position }.
    Le client poll GET /api/queue/job/{job_id} pour suivre la progression
    et récupérer le résultat final { nodes, edges }.
    """
    if not body.prompt.strip():
        raise HTTPException(status_code=422, detail="Le prompt ne peut pas être vide.")

    job_id = body.job_id or str(uuid.uuid4())

    # Estimer la position initiale : jobs en file + job en cours + ce job
    q = llm_queue.status
    estimated_position = q["pending"] + (1 if q["currently_processing"] else 0) + 1

    # Pré-enregistrer AVANT le create_task pour éviter le race condition sur le polling
    job_store.preregister(job_id, estimated_position)

    # Soumettre en arrière-plan — ne pas attendre
    asyncio.create_task(_decompose_task(job_id, body.prompt))

    return {"job_id": job_id, "status": "queued", "position": estimated_position}

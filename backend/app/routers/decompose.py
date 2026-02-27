import asyncio
import uuid

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
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
    Le client se connecte via WS /api/ws/job/{job_id} pour suivre la progression
    et récupérer le résultat final { nodes, edges }.
    """
    if not body.prompt.strip():
        raise HTTPException(status_code=422, detail="Le prompt ne peut pas être vide.")

    job_id = body.job_id or str(uuid.uuid4())

    # Estimer la position initiale : jobs en file + job en cours + ce job
    q = llm_queue.status
    estimated_position = q["pending"] + (1 if q["currently_processing"] else 0) + 1

    # Pré-enregistrer AVANT le create_task pour éviter le race condition
    job_store.preregister(job_id, estimated_position)

    # Soumettre en arrière-plan — ne pas attendre
    asyncio.create_task(_decompose_task(job_id, body.prompt))

    return {"job_id": job_id, "status": "queued", "position": estimated_position}


@router.websocket("/ws/job/{job_id}")
async def ws_job_status(websocket: WebSocket, job_id: str) -> None:
    """
    WebSocket — pousse les mises à jour de statut d'un job en temps réel.

    Messages envoyés :
      { job_id, status: "queued",      position: N }
      { job_id, status: "processing",  position: 0 }
      { job_id, status: "done",        result: {nodes, edges} }
      { job_id, status: "error",       error: "..." }

    La connexion se ferme automatiquement dès que le job est terminal (done/error).
    """
    await websocket.accept()
    last_payload: dict | None = None

    try:
        while True:
            # Priorité : statut live de la LLMQueue (position exacte)
            live = llm_queue.get_job_status(job_id)
            if live:
                current = live
            else:
                stored = job_store.get(job_id)
                current = {"job_id": job_id, **(stored or {"status": "unknown"})}

            # N'envoyer que si le statut a changé
            if current != last_payload:
                await websocket.send_json(current)
                last_payload = current

            # Fermer sur état terminal
            if current.get("status") in ("done", "error"):
                break

            await asyncio.sleep(0.3)

    except WebSocketDisconnect:
        pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass

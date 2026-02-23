from fastapi import APIRouter, HTTPException
from app.models.blocks import DecomposeRequest, DecomposeResponse
from app.services.decomposer import decompose

router = APIRouter()


@router.post("/decompose", response_model=DecomposeResponse)
async def decompose_prompt(body: DecomposeRequest) -> DecomposeResponse:
    """
    Décompose un prompt brut en blocs logiques (nodes + edges).

    - Si une clé API est configurée → utilise le LLM
    - Sinon → fallback heuristique par keywords
    """
    if not body.prompt.strip():
        raise HTTPException(status_code=422, detail="Le prompt ne peut pas être vide.")

    try:
        return await decompose(body.prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

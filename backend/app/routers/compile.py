from fastapi import APIRouter, HTTPException
from app.models.blocks import CompileRequest, CompiledPrompt
from app.services.compiler import compile

router = APIRouter()


@router.post("/compile", response_model=CompiledPrompt)
async def compile_prompt(body: CompileRequest) -> CompiledPrompt:
    """
    Recompile une liste ordonnée de blocs en un prompt optimisé machine-readable.

    - Si une clé API est configurée → LLM optimise le prompt
    - Sinon → compilation structurée XML
    """
    if not body.blocks:
        raise HTTPException(status_code=422, detail="La liste de blocs ne peut pas être vide.")

    try:
        return await compile(body.blocks)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

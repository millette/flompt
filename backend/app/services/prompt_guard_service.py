"""
Prompt Guard Service — Filtre de sécurité via HuggingFace Inference API.
Modèle : meta-llama/Llama-Guard-4-12B (serverless, aucun modèle local requis).

Pré-requis :
  - HUGGINGFACE_TOKEN dans .env (compte HF + licence Meta acceptée sur hf.co)
  - Aucune dépendance ML locale (torch, transformers non requis)

Taxonomie MLCommons Hazard S1–S14 :
  S1  Violent Crimes            S8  Intellectual Property
  S2  Non-Violent Crimes        S9  Indiscriminate Weapons
  S3  Sex-Related Crimes        S10 Hate
  S4  Child Sexual Exploitation S11 Suicide & Self-Harm
  S5  Defamation                S12 Sexual Content
  S6  Specialized Advice        S13 Elections
  S7  Privacy                   S14 Code Interpreter Abuse

Format de réponse du modèle :
  "safe"           → prompt conforme
  "unsafe\\nS9"    → 1 catégorie violée
  "unsafe\\nS1\\nS3" → plusieurs catégories

Comportement fail-open :
  Si HUGGINGFACE_TOKEN absent ou si l'API échoue → tous les prompts passent + warning.

Env vars :
  HUGGINGFACE_TOKEN=hf_...       (requis)
  PROMPT_GUARD_ENABLED=true      (défaut : true)
"""

import os
import logging
import httpx

logger = logging.getLogger(__name__)

MODEL_ID   = "meta-llama/Llama-Guard-4-12B"
HF_API_URL = "https://api-inference.huggingface.co/v1/chat/completions"
TIMEOUT    = 30.0

# Taxonomie complète MLCommons Hazard Taxonomy
HAZARD_CATEGORIES: dict[str, str] = {
    "S1":  "Violent Crimes",
    "S2":  "Non-Violent Crimes",
    "S3":  "Sex-Related Crimes",
    "S4":  "Child Sexual Exploitation",
    "S5":  "Defamation",
    "S6":  "Specialized Advice",
    "S7":  "Privacy",
    "S8":  "Intellectual Property",
    "S9":  "Indiscriminate Weapons",
    "S10": "Hate",
    "S11": "Suicide & Self-Harm",
    "S12": "Sexual Content",
    "S13": "Elections",
    "S14": "Code Interpreter Abuse",
}


def _is_enabled() -> bool:
    return os.getenv("PROMPT_GUARD_ENABLED", "true").lower() not in ("false", "0", "no")


def _get_token() -> str | None:
    return os.getenv("HUGGINGFACE_TOKEN") or os.getenv("HF_TOKEN")


async def _call_hf_api(prompt: str) -> str:
    """
    Appelle l'API Inference HuggingFace (chat completions) avec Llama Guard 4.
    Retourne la réponse brute du modèle ("safe" ou "unsafe\\nS9").
    """
    token = _get_token()

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        resp = await client.post(
            HF_API_URL,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json={
                "model": MODEL_ID,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                "max_tokens": 20,
                "stream": False,
            },
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"].strip()


def _parse_response(raw: str) -> tuple[bool, list[str], list[str]]:
    """
    Parse la sortie de Llama Guard 4.

    "safe"              → (True, [], [])
    "unsafe\\nS9"       → (False, ["S9"], ["Indiscriminate Weapons"])
    "unsafe\\nS1\\nS3"  → (False, ["S1","S3"], ["Violent Crimes","Sex-Related Crimes"])

    Robuste aux variantes : majuscules, virgules, espaces.
    """
    lines = [l.strip() for l in raw.strip().splitlines() if l.strip()]

    if not lines or lines[0].lower() == "safe":
        return True, [], []

    codes: list[str] = []
    for line in lines[1:]:
        for part in line.split(","):
            code = part.strip().upper()
            if code.startswith("S") and code[1:].isdigit():
                codes.append(code)

    names = [HAZARD_CATEGORIES.get(c, c) for c in codes]

    logger.warning(
        f"[Prompt Guard] 🚨 UNSAFE — violations={codes} "
        f"({', '.join(names) if names else 'catégorie inconnue'})"
    )
    return False, codes, names


async def classify(prompt: str) -> tuple[bool, list[str], list[str], str]:
    """
    Classifie un prompt via Llama Guard 4 12B (HF Inference API).

    Retourne : (is_safe, violation_codes, violation_names, raw_response)
      is_safe         : True → prompt conforme
      violation_codes : ["S1", "S10"] — codes MLCommons
      violation_names : ["Violent Crimes", "Hate"] — noms lisibles transmis au client
      raw_response    : réponse brute du modèle

    Fail-open si : guard désactivé, token absent, ou erreur API.
    """
    if not _is_enabled():
        return True, [], [], "safe"

    token = _get_token()
    if not token:
        logger.warning(
            "[Prompt Guard] ⚠️  HUGGINGFACE_TOKEN manquant — fail-open activé. "
            "Ajoute HUGGINGFACE_TOKEN=hf_... dans ton .env."
        )
        return True, [], [], "safe"

    try:
        raw = await _call_hf_api(prompt)
        is_safe, codes, names = _parse_response(raw)
        if is_safe:
            logger.debug(f"[Prompt Guard] ✅ safe — raw={raw!r}")
        return is_safe, codes, names, raw

    except httpx.HTTPStatusError as e:
        status = e.response.status_code
        if status == 401:
            logger.error(
                "[Prompt Guard] 🔑 Token HF invalide ou licence Meta non acceptée "
                "(401) — fail-open. Vérifie ton HUGGINGFACE_TOKEN sur hf.co."
            )
        elif status == 403:
            logger.error(
                "[Prompt Guard] 🚫 Accès refusé (403) — accepte la licence Meta "
                "pour meta-llama/Llama-Guard-4-12B sur huggingface.co — fail-open."
            )
        elif status == 503:
            logger.warning("[Prompt Guard] ⏳ Modèle en cours de chargement côté HF (503) — fail-open.")
        else:
            logger.warning(f"[Prompt Guard] ⚠️  Erreur HTTP {status} — fail-open.")
        return True, [], [], "safe"

    except httpx.TimeoutException:
        logger.warning("[Prompt Guard] ⏱️  Timeout API HF — fail-open.")
        return True, [], [], "safe"

    except Exception as exc:
        logger.warning(f"[Prompt Guard] ⚠️  Erreur inattendue — fail-open. Raison : {exc}")
        return True, [], [], "safe"

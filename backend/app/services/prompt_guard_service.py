"""
Prompt Guard Service — Filtre de sécurité basé sur meta-llama/Llama-Guard-4-12B.

Llama Guard 4 est un modèle génératif (12B, basé sur Llama 4 Scout) qui analyse
les prompts entrants et retourne "safe" ou "unsafe\n<catégorie(s)>".

Taxonomie MLCommons Hazard (S1–S14) :
  S1  Violent Crimes            S8  Intellectual Property
  S2  Non-Violent Crimes        S9  Indiscriminate Weapons
  S3  Sex-Related Crimes        S10 Hate
  S4  Child Sexual Exploitation S11 Suicide & Self-Harm
  S5  Defamation                S12 Sexual Content
  S6  Specialized Advice        S13 Elections
  S7  Privacy                   S14 Code Interpreter Abuse

Format de sortie du modèle :
  "safe"          → prompt conforme
  "unsafe\nS9"    → violation de la catégorie S9 (Indiscriminate Weapons)
  "unsafe\nS1\nS3" → violations multiples

Comportement :
  - Fail-open : si le modèle ne peut pas se charger, tous les prompts passent (+ warning).
  - Lazy-load : chargement à la première requête (pas au démarrage).
  - CPU/GPU : device_map="auto" → GPU si disponible, sinon CPU.
  - Thread-safe : inférence dans asyncio.to_thread (non bloquant).

Env vars :
  PROMPT_GUARD_ENABLED=true      (défaut : true)
  HUGGINGFACE_TOKEN=hf_...       (requis — modèle gated sur HuggingFace)

Installation :
  pip install "git+https://github.com/huggingface/transformers@v4.51.3-LlamaGuard-preview" hf_xet torch
"""

import os
import asyncio
import logging
from typing import Optional

logger = logging.getLogger(__name__)

MODEL_ID = "meta-llama/Llama-Guard-4-12B"

# Taxonomie complète MLCommons Hazard Taxonomy (Llama Guard 4)
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

# État global — lazy-loaded
_processor = None
_model = None
_guard_lock = asyncio.Lock()
_load_failed = False


def _is_enabled() -> bool:
    return os.getenv("PROMPT_GUARD_ENABLED", "true").lower() not in ("false", "0", "no")


def _load_model_sync():
    """
    Charge AutoProcessor + Llama4ForConditionalGeneration en mode synchrone.
    Appelé via asyncio.to_thread pour ne pas bloquer la boucle d'événements.
    """
    try:
        from transformers import AutoProcessor, Llama4ForConditionalGeneration
        import torch
    except (ImportError, AttributeError):
        raise RuntimeError(
            "transformers LlamaGuard preview non installé.\n"
            "Installe via : pip install "
            "'git+https://github.com/huggingface/transformers@v4.51.3-LlamaGuard-preview' "
            "hf_xet torch"
        )

    hf_token = os.getenv("HUGGINGFACE_TOKEN") or os.getenv("HF_TOKEN")
    if not hf_token:
        raise RuntimeError(
            "HUGGINGFACE_TOKEN manquant — requis pour charger un modèle Meta gated."
        )

    logger.info(f"[Prompt Guard] ⏳ Chargement de {MODEL_ID}…")

    processor = AutoProcessor.from_pretrained(MODEL_ID, token=hf_token)

    model = Llama4ForConditionalGeneration.from_pretrained(
        MODEL_ID,
        device_map="auto",   # GPU si disponible, sinon CPU
        torch_dtype="bfloat16",
        token=hf_token,
    )
    model.eval()

    device = next(model.parameters()).device
    logger.info(f"[Prompt Guard] ✅ Llama Guard 4 12B chargé sur {device}")
    return processor, model


async def _get_model():
    """Retourne (processor, model). None, None si fail-open."""
    global _processor, _model, _load_failed

    if _load_failed:
        return None, None
    if _processor is not None and _model is not None:
        return _processor, _model

    async with _guard_lock:
        if _processor is not None:
            return _processor, _model
        if _load_failed:
            return None, None

        try:
            _processor, _model = await asyncio.to_thread(_load_model_sync)
            return _processor, _model
        except Exception as exc:
            _load_failed = True
            logger.warning(
                f"[Prompt Guard] ⚠️  Impossible de charger {MODEL_ID} — fail-open activé.\n"
                f"  Raison : {exc}"
            )
            return None, None


def _infer_sync(processor, model, prompt: str) -> str:
    """
    Inférence synchrone Llama Guard 4.
    Le contenu est encapsulé au format multimodal text (requis par Llama 4).
    Appelé via asyncio.to_thread.
    """
    messages = [
        {
            "role": "user",
            "content": [{"type": "text", "text": prompt}],
        }
    ]

    inputs = processor.apply_chat_template(
        messages,
        tokenize=True,
        add_generation_prompt=True,
        return_tensors="pt",
        return_dict=True,
    ).to(model.device)

    with __import__("torch").no_grad():
        output_ids = model.generate(
            **inputs,
            max_new_tokens=20,   # "safe" ou "unsafe\nS9" — très court
            do_sample=False,
        )

    # Décoder uniquement les tokens générés (pas le prompt d'entrée)
    generated = output_ids[:, inputs["input_ids"].shape[-1]:]
    return processor.batch_decode(generated, skip_special_tokens=True)[0].strip()


def _parse_response(raw: str) -> tuple[bool, list[str], list[str]]:
    """
    Parse la sortie de Llama Guard 4.

    Format attendu :
      "safe"               → (True, [], [])
      "unsafe\\nS9"        → (False, ["S9"], ["Indiscriminate Weapons"])
      "unsafe\\nS1\\nS3"   → (False, ["S1", "S3"], ["Violent Crimes", "Sex-Related Crimes"])

    Robuste aux variations de formatage (majuscules, virgules, espaces).
    """
    lines = [line.strip() for line in raw.strip().splitlines() if line.strip()]

    if not lines or lines[0].lower() == "safe":
        return True, [], []

    # Extraire les codes de violation (toutes lignes après "unsafe")
    codes: list[str] = []
    for line in lines[1:]:
        # Support "S1,S3" ou "S1" ou "S1\nS3"
        for part in line.split(","):
            code = part.strip().upper()
            if code.startswith("S") and code[1:].isdigit():
                codes.append(code)

    names = [HAZARD_CATEGORIES.get(c, c) for c in codes]

    logger.warning(
        f"[Prompt Guard] 🚨 Prompt UNSAFE — violations={codes} ({', '.join(names)})"
    )
    return False, codes, names


async def classify(prompt: str) -> tuple[bool, list[str], list[str], str]:
    """
    Classifie un prompt via Llama Guard 4 12B.

    Retourne : (is_safe, violation_codes, violation_names, raw_response)
      is_safe          : True → prompt conforme
      violation_codes  : ["S1", "S9"] — codes de la taxonomie MLCommons
      violation_names  : ["Violent Crimes", "Indiscriminate Weapons"] — noms lisibles
      raw_response     : réponse brute du modèle

    Fail-open : retourne (True, [], [], "safe") si modèle indisponible.
    """
    if not _is_enabled():
        return True, [], [], "safe"

    processor, model = await _get_model()
    if processor is None or model is None:
        return True, [], [], "safe"

    try:
        raw = await asyncio.to_thread(_infer_sync, processor, model, prompt)
        is_safe, codes, names = _parse_response(raw)
        logger.debug(f"[Prompt Guard] raw={raw!r} → codes={codes}")
        return is_safe, codes, names, raw

    except Exception as exc:
        logger.warning(f"[Prompt Guard] ⚠️  Erreur d'inférence — fail-open. Raison : {exc}")
        return True, [], [], "safe"

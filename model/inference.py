"""
FLAN-T5 Inference Wrapper

Loads the fine-tuned model and provides the same interface as ai_service.decompose_with_ai.

Usage:
    from inference import FlomptT5

    model = FlomptT5()                        # loads default checkpoint
    model = FlomptT5("checkpoints/flan-t5-base-flompt/final")

    # Synchronous
    blocks = model.decompose("You are a Python expert. Write a sorting function.")

    # As a drop-in replacement for the service
    result = model.decompose_to_nodes("your raw prompt")   # returns DecomposeResponse
"""

import json
import time
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# Default checkpoint path
DEFAULT_CHECKPOINT = Path(__file__).parent / "checkpoints" / "flan-t5-base-flompt" / "final"

# Instruction template (must match train.py exactly)
INSTRUCTION = (
    "Decompose the following AI prompt into structured blocks. "
    "Return only valid JSON with this format: "
    '{{"blocks": [{{"type": "role|context|objective|input|document|constraints|'
    'output_format|format_control|examples|chain_of_thought|language", '
    '"content": "...", "summary": "2-5 word label"}}]}}. '
    "Always include a language block.\n\nPrompt: {prompt}"
)

VALID_BLOCK_TYPES = {
    "role", "context", "objective", "input", "document",
    "constraints", "output_format", "format_control",
    "examples", "chain_of_thought", "language"
}


class FlomptT5:
    """
    Fine-tuned FLAN-T5 model for prompt decomposition.

    Lazy-loads the model on first use (saves memory if not needed).
    Thread-safe for read-only inference.
    """

    def __init__(self, checkpoint_path: Optional[str] = None):
        self.checkpoint_path = str(checkpoint_path or DEFAULT_CHECKPOINT)
        self._model = None
        self._tokenizer = None
        self._loaded = False

    def _load(self) -> None:
        """Load model and tokenizer (called lazily on first use)."""
        if self._loaded:
            return

        try:
            from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
            import torch
        except ImportError:
            raise RuntimeError(
                "Missing dependencies. Run: pip install -r model/requirements.txt"
            )

        path = Path(self.checkpoint_path)
        if not path.exists():
            raise FileNotFoundError(
                f"Checkpoint not found: {path}\n"
                "Run train.py first to generate a checkpoint."
            )

        logger.info(f"Loading FLAN-T5 from {path}...")
        t0 = time.time()

        self._tokenizer = AutoTokenizer.from_pretrained(str(path))
        self._model = AutoModelForSeq2SeqLM.from_pretrained(str(path))
        self._model.eval()

        try:
            import torch
            self._device = "cuda" if torch.cuda.is_available() else "cpu"
            self._model = self._model.to(self._device)
        except Exception:
            self._device = "cpu"

        self._loaded = True
        logger.info(f"✅ Model loaded in {time.time() - t0:.1f}s on {self._device}")

    def decompose(
        self,
        prompt: str,
        max_new_tokens: int = 512,
        num_beams: int = 4,
        temperature: Optional[float] = None,
    ) -> list[dict]:
        """
        Decompose a raw prompt into structured blocks.

        Returns a list of block dicts: [{"type": "...", "content": "...", "summary": "..."}]
        Falls back to a minimal objective block if generation fails.
        """
        self._load()

        instruction = INSTRUCTION.format(prompt=prompt)
        t0 = time.time()

        # Tokenize
        inputs = self._tokenizer(
            instruction,
            return_tensors="pt",
            max_length=512,
            truncation=True,
        )
        inputs = {k: v.to(self._device) for k, v in inputs.items()}

        # Generate
        generate_kwargs = dict(
            **inputs,
            max_new_tokens=max_new_tokens,
            num_beams=num_beams,
            early_stopping=True,
        )
        if temperature is not None:
            generate_kwargs["do_sample"] = True
            generate_kwargs["temperature"] = temperature

        with __import__("torch").no_grad():
            outputs = self._model.generate(**generate_kwargs)

        elapsed = time.time() - t0

        # Decode
        raw = self._tokenizer.decode(outputs[0], skip_special_tokens=True)
        logger.debug(f"Generated in {elapsed:.2f}s: {raw[:100]}…")

        return self._parse_output(raw, prompt)

    def _parse_output(self, raw: str, original_prompt: str) -> list[dict]:
        """Parse model output JSON. Falls back gracefully on parse errors."""
        raw = raw.strip()

        # Try direct parse
        try:
            data = json.loads(raw)
            blocks = data.get("blocks", [])
            if blocks:
                return self._validate_blocks(blocks)
        except json.JSONDecodeError:
            pass

        # Try to extract JSON from within the text
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start >= 0 and end > start:
            try:
                data = json.loads(raw[start:end])
                blocks = data.get("blocks", [])
                if blocks:
                    return self._validate_blocks(blocks)
            except json.JSONDecodeError:
                pass

        # Fallback: single objective block
        logger.warning(f"Failed to parse model output — using fallback block")
        return [
            {"type": "objective", "content": original_prompt, "summary": "Main task"},
            {"type": "language", "content": "English", "summary": "English"},
        ]

    def _validate_blocks(self, blocks: list[dict]) -> list[dict]:
        """Filter out invalid blocks and ensure required fields."""
        valid = []
        for b in blocks:
            if not isinstance(b, dict):
                continue
            block_type = b.get("type", "")
            if block_type not in VALID_BLOCK_TYPES:
                logger.debug(f"Skipping invalid block type: {block_type}")
                continue
            content = b.get("content", "").strip()
            if not content:
                continue
            valid.append({
                "type": block_type,
                "content": content,
                "summary": b.get("summary", content[:40]),
            })

        # Ensure language block is always present
        types = {b["type"] for b in valid}
        if "language" not in types:
            valid.append({"type": "language", "content": "English", "summary": "English"})

        return valid if valid else [
            {"type": "objective", "content": "Main task", "summary": "Main task"},
            {"type": "language", "content": "English", "summary": "English"},
        ]

    def decompose_to_nodes(self, raw_prompt: str):
        """
        Drop-in replacement for ai_service.decompose_with_ai + decomposer._build_nodes_and_edges.
        Returns a DecomposeResponse with nodes and edges.
        """
        import sys
        sys.path.insert(0, str(Path(__file__).parents[1] / "backend"))

        from app.services.decomposer import _build_nodes_and_edges
        blocks = self.decompose(raw_prompt)
        return _build_nodes_and_edges(blocks)

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    def unload(self) -> None:
        """Free model memory."""
        self._model = None
        self._tokenizer = None
        self._loaded = False
        try:
            import gc
            gc.collect()
            import torch
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        except Exception:
            pass


# ─── CLI quick test ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    checkpoint = sys.argv[1] if len(sys.argv) > 1 else None
    model = FlomptT5(checkpoint)

    test_prompts = [
        "You are a senior Python developer. Write a function that parses JSON with error handling.",
        "Translate this text to Spanish and keep a formal tone.",
        "Act as a marketing expert. Create a 30-day content calendar for a SaaS startup targeting developers.",
    ]

    for prompt in test_prompts:
        print(f"\n{'='*60}")
        print(f"INPUT: {prompt[:80]}...")
        print("─" * 60)
        t0 = time.time()
        blocks = model.decompose(prompt)
        elapsed = time.time() - t0
        print(f"OUTPUT ({len(blocks)} blocks in {elapsed:.2f}s):")
        for b in blocks:
            print(f"  [{b['type'].upper()}] {b['summary']}: {b['content'][:60]}…")

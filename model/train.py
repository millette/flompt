"""
FLAN-T5 Fine-tuning for Prompt Decomposition

Fine-tunes google/flan-t5-base or flan-t5-large on the flompt decomposition task.
Input:  "Decompose this prompt into structured blocks:\n{raw_prompt}"
Output: '{"blocks": [{"type": "...", "content": "...", "summary": "..."}]}'

Usage:
    # Basic (flan-t5-base, fast, CPU-friendly)
    python train.py

    # Better quality (flan-t5-large, needs 4GB+ RAM, GPU recommended)
    python train.py --model google/flan-t5-base

    # Resume from checkpoint
    python train.py --resume checkpoints/flan-t5-flompt/checkpoint-200

    # Quick smoke test (5 examples)
    python train.py --smoke-test

Output: checkpoints/flan-t5-flompt/
"""

import os
import sys
import json
import argparse
import logging
from pathlib import Path
from typing import Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# ─── Paths ────────────────────────────────────────────────────────────────────

ROOT = Path(__file__).parent
DATA_DIR = ROOT / "dataset" / "data"
CHECKPOINTS_DIR = ROOT / "checkpoints"

# ─── Instruction template ─────────────────────────────────────────────────────
# Framed as a T5 instruction-following task.
# Keeping it concise (T5 has 512 token input limit by default).

INSTRUCTION = (
    "Decompose the following AI prompt into structured blocks. "
    "Return only valid JSON with this format: "
    '{{"blocks": [{{"type": "role|context|objective|input|document|constraints|'
    'output_format|format_control|examples|chain_of_thought|language", '
    '"content": "...", "summary": "2-5 word label"}}]}}. '
    "Always include a language block.\n\nPrompt: {prompt}"
)

MAX_INPUT_LENGTH = 256    # Reduced to fit in 4GB RAM on CPU
MAX_TARGET_LENGTH = 256   # JSON output usually < 256 tokens


def format_input(prompt: str) -> str:
    return INSTRUCTION.format(prompt=prompt)


# ─── Dataset loading ──────────────────────────────────────────────────────────

def load_jsonl(path: Path) -> list[dict]:
    records = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return records


def load_splits(smoke_test: bool = False) -> tuple[list, list, list]:
    """Load train/val/test splits. Falls back to raw.jsonl if splits don't exist."""
    train_path = DATA_DIR / "train.jsonl"
    val_path = DATA_DIR / "val.jsonl"
    test_path = DATA_DIR / "test.jsonl"
    raw_path = DATA_DIR / "raw.jsonl"

    if train_path.exists():
        train = load_jsonl(train_path)
        val = load_jsonl(val_path) if val_path.exists() else []
        test = load_jsonl(test_path) if test_path.exists() else []
    elif raw_path.exists():
        logger.warning("No splits found — using raw.jsonl with 80/10/10 split")
        all_records = load_jsonl(raw_path)
        import random
        random.seed(42)
        random.shuffle(all_records)
        n = len(all_records)
        train = all_records[:int(n * 0.8)]
        val = all_records[int(n * 0.8):int(n * 0.9)]
        test = all_records[int(n * 0.9):]
    else:
        raise FileNotFoundError(
            f"No dataset found in {DATA_DIR}. "
            "Run: python dataset/generate_dataset.py first."
        )

    if smoke_test:
        train, val, test = train[:5], val[:2], test[:2]
        logger.info("🧪 Smoke test mode: using tiny subset")

    logger.info(f"Dataset: {len(train)} train / {len(val)} val / {len(test)} test")
    return train, val, test


# ─── Tokenization ─────────────────────────────────────────────────────────────

def tokenize_dataset(records: list[dict], tokenizer, is_train: bool = True):
    """Convert records to tokenized HuggingFace Dataset."""
    from datasets import Dataset

    inputs = [format_input(r["input"]) for r in records]
    targets = [r["output"] for r in records]

    # Tokenize inputs
    model_inputs = tokenizer(
        inputs,
        max_length=MAX_INPUT_LENGTH,
        truncation=True,
        padding="max_length",
    )

    # Tokenize targets (labels)
    # Note: as_target_tokenizer() was removed in transformers 5.x
    labels = tokenizer(
        text_target=targets,
        max_length=MAX_TARGET_LENGTH,
        truncation=True,
        padding="max_length",
    )

    # Replace padding token id with -100 (ignored in loss computation)
    label_ids = [
        [(-100 if token == tokenizer.pad_token_id else token) for token in label]
        for label in labels["input_ids"]
    ]

    model_inputs["labels"] = label_ids
    return Dataset.from_dict(model_inputs)


# ─── Training ─────────────────────────────────────────────────────────────────

def train(
    model_name: str = "google/flan-t5-small",
    output_dir: Optional[str] = None,
    resume_from: Optional[str] = None,
    smoke_test: bool = False,
    num_epochs: int = 5,
    batch_size: int = 4,
    learning_rate: float = 3e-4,
    warmup_steps: int = 50,
    save_steps: int = 100,
    eval_steps: int = 100,
    logging_steps: int = 20,
) -> None:
    try:
        from transformers import (
            AutoTokenizer, AutoModelForSeq2SeqLM,
            Seq2SeqTrainer, Seq2SeqTrainingArguments,
            DataCollatorForSeq2Seq, EarlyStoppingCallback,
        )
        import torch
    except ImportError:
        logger.error("Missing dependencies. Run: pip install -r requirements.txt")
        sys.exit(1)

    # ── Output dir ────────────────────────────────────────────────────────────
    if output_dir is None:
        model_slug = model_name.split("/")[-1]
        output_dir = str(CHECKPOINTS_DIR / f"{model_slug}-flompt")
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    # ── Device ────────────────────────────────────────────────────────────────
    device = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
    logger.info(f"Device: {device}")
    if device == "cpu":
        logger.warning(
            "⚠️  Training on CPU — this will be slow. "
            "For GPU training, use Google Colab or a cloud instance."
        )

    # ── Load model & tokenizer ────────────────────────────────────────────────
    logger.info(f"Loading model: {model_name}")
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

    total_params = sum(p.numel() for p in model.parameters())
    logger.info(f"Model parameters: {total_params:,} ({total_params/1e6:.0f}M)")

    # ── Load dataset ──────────────────────────────────────────────────────────
    train_records, val_records, _ = load_splits(smoke_test=smoke_test)

    logger.info("Tokenizing dataset...")
    train_dataset = tokenize_dataset(train_records, tokenizer, is_train=True)
    val_dataset = tokenize_dataset(val_records, tokenizer, is_train=False) if val_records else None

    # ── Training arguments ────────────────────────────────────────────────────
    training_args = Seq2SeqTrainingArguments(
        output_dir=output_dir,
        num_train_epochs=num_epochs,
        per_device_train_batch_size=batch_size,
        per_device_eval_batch_size=batch_size,
        # Adafactor: native T5 optimizer, ~3× less RAM than AdamW
        # Critical for CPU training on limited RAM (4GB server)
        optim="adafactor",
        learning_rate=learning_rate,
        warmup_steps=warmup_steps,
        weight_decay=0.0,           # Adafactor handles its own regularization
        gradient_accumulation_steps=8,  # effective batch = batch_size × 8
        predict_with_generate=True,
        generation_max_length=MAX_TARGET_LENGTH,
        # Evaluation (transformers 5.x: evaluation_strategy → eval_strategy)
        eval_strategy="steps" if val_dataset else "no",
        eval_steps=eval_steps,
        load_best_model_at_end=bool(val_dataset),
        metric_for_best_model="eval_loss",
        greater_is_better=False,
        # Saving
        save_strategy="steps",
        save_steps=save_steps,
        save_total_limit=3,
        # Logging
        logging_steps=logging_steps,
        report_to="none",
        # Performance
        fp16=False,                 # CPU only — no fp16
        bf16=False,
        dataloader_num_workers=0,
        # Misc
        resume_from_checkpoint=resume_from,
    )

    data_collator = DataCollatorForSeq2Seq(
        tokenizer,
        model=model,
        padding=True,
        label_pad_token_id=-100,
    )

    callbacks = []
    if val_dataset:
        callbacks.append(EarlyStoppingCallback(early_stopping_patience=3))

    trainer = Seq2SeqTrainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        processing_class=tokenizer,   # transformers 5.x: tokenizer → processing_class
        data_collator=data_collator,
        callbacks=callbacks,
    )

    # ── Train ─────────────────────────────────────────────────────────────────
    logger.info("🚀 Starting training...")
    trainer.train(resume_from_checkpoint=resume_from)

    # ── Save final model ──────────────────────────────────────────────────────
    final_dir = Path(output_dir) / "final"
    trainer.save_model(str(final_dir))
    tokenizer.save_pretrained(str(final_dir))
    logger.info(f"✅ Model saved to {final_dir}")

    # Save training config for reference
    config = {
        "base_model": model_name,
        "num_epochs": num_epochs,
        "batch_size": batch_size,
        "learning_rate": learning_rate,
        "max_input_length": MAX_INPUT_LENGTH,
        "max_target_length": MAX_TARGET_LENGTH,
        "train_examples": len(train_records),
        "val_examples": len(val_records),
        "device": device,
    }
    with open(Path(output_dir) / "training_config.json", "w") as f:
        json.dump(config, f, indent=2)

    logger.info("🎉 Training complete!")


# ─── CLI ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fine-tune FLAN-T5 for prompt decomposition")
    parser.add_argument("--model", default="google/flan-t5-small",
                        help="Base model (default: flan-t5-small for CPU; flan-t5-base needs GPU)")
    parser.add_argument("--output-dir", default=None, help="Output directory for checkpoints")
    parser.add_argument("--resume", default=None, help="Resume from checkpoint path")
    parser.add_argument("--smoke-test", action="store_true", help="Quick test with 5 examples")
    parser.add_argument("--epochs", type=int, default=5, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=4, help="Batch size per device")
    parser.add_argument("--lr", type=float, default=3e-4, help="Learning rate")
    args = parser.parse_args()

    train(
        model_name=args.model,
        output_dir=args.output_dir,
        resume_from=args.resume,
        smoke_test=args.smoke_test,
        num_epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.lr,
    )

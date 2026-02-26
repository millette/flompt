"""
Dataset Generator

Calls Anthropic API directly on each seed prompt to produce labeled pairs:
  (raw_prompt, blocks_json)

Output: dataset/data/raw.jsonl  → one JSON object per line
        dataset/data/train.jsonl / val.jsonl / test.jsonl  (after split)

Usage:
    python dataset/generate_dataset.py
    python dataset/generate_dataset.py --limit 50       # quick test run
    python dataset/generate_dataset.py --split          # split existing raw.jsonl
"""

import os
import sys
import json
import time
import asyncio
import argparse
import random
from pathlib import Path
from typing import Optional

import httpx
from dotenv import load_dotenv

# Load .env from backend folder (contains ANTHROPIC_API_KEY)
ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / "backend" / ".env")

sys.path.insert(0, str(ROOT / "backend"))
sys.path.insert(0, str(Path(__file__).parent))
from seed_prompts import get_all_prompts

# ─── Config ───────────────────────────────────────────────────────────────────

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
MODEL = os.getenv("AI_MODEL", "claude-sonnet-4-20250514")
TIMEOUT = 60.0
MAX_RETRIES = 3
RETRY_DELAYS = [5, 15, 30]

DATA_DIR = Path(__file__).parent / "data"
RAW_FILE = DATA_DIR / "raw.jsonl"

# Same system prompt as the production service
DECOMPOSE_SYSTEM_PROMPT = """You are a prompt engineering expert specializing in Claude AI best practices. Analyze the user's prompt and BUILD a structured workflow by decomposing it into typed blocks.

Block types available:
- role: The AI persona/role (who the AI should be)
- context: Background information and situational context
- objective: The main goal or task to accomplish
- input: Data or variables provided to the AI (code, text to analyze, etc.)
- document: External reference content for XML grounding (articles, code files, datasets) — ONLY use if the prompt explicitly references external documents to inject; content = the document placeholder or excerpt
- constraints: Rules, restrictions, and limits
- output_format: Expected response format and structure (JSON, markdown, numbered list, etc.)
- format_control: Claude-specific formatting directives — tone, verbosity, markdown on/off, response length (e.g. "Be concise. Use markdown headers. No preamble.")
- examples: Few-shot input/output pairs — format content as "Input: [...]\nOutput: [...]" pairs separated by blank lines
- chain_of_thought: Explicit reasoning instructions (e.g. "Think step by step before answering. Show your reasoning.")
- language: The language the AI should respond in (auto-detect from the user's prompt)

Return ONLY valid JSON, no markdown:
{"blocks": [{"type": "<type>", "content": "<detailed content>", "summary": "<2-5 word label>"}]}

Rules:
- CONSTRUCT a proper workflow — rewrite each block with clear, actionable content, don't just copy-paste
- The "summary" field is a very short label (2-5 words max) for at-a-glance reading (e.g. "Senior Python dev", "JSON with metadata", "Max 3 sentences")
- Write content and summary in the SAME language as the user's prompt
- Only include blocks that are semantically present or clearly implied
- ALWAYS include a "language" block — detect the prompt language and set it as the content (e.g. "English", "French", "Spanish")
- For "examples": format as "Input: [value]\nOutput: [value]" pairs separated by blank lines
- For "document": only use when the prompt explicitly mentions injecting external documents
- For "format_control": use for style/formatting directives that aren't already in output_format
- Minimum 2 blocks, maximum 11 blocks
- If unclear, default to objective + language"""


# ─── Anthropic call ───────────────────────────────────────────────────────────

async def call_anthropic(prompt: str) -> Optional[list[dict]]:
    """Call Anthropic API and return parsed blocks, or None on failure."""
    if not ANTHROPIC_API_KEY:
        raise RuntimeError("ANTHROPIC_API_KEY not set")

    for attempt in range(MAX_RETRIES):
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                resp = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": ANTHROPIC_API_KEY,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={
                        "model": MODEL,
                        "max_tokens": 2048,
                        "system": DECOMPOSE_SYSTEM_PROMPT,
                        "messages": [{"role": "user", "content": prompt}],
                    }
                )
                resp.raise_for_status()
                text = resp.json()["content"][0]["text"].strip()

                # Strip markdown fences if present
                if text.startswith("```"):
                    text = text[text.index("\n") + 1:]
                if text.endswith("```"):
                    text = text[:-3].strip()

                data = json.loads(text)
                blocks = data.get("blocks", [])

                # Validate: minimum 2 blocks, all have required fields
                if len(blocks) < 2:
                    print(f"  ⚠️  Only {len(blocks)} block(s) — skipping")
                    return None

                valid_types = {
                    "role", "context", "objective", "input", "document",
                    "constraints", "output_format", "format_control",
                    "examples", "chain_of_thought", "language"
                }
                for b in blocks:
                    if b.get("type") not in valid_types:
                        print(f"  ⚠️  Invalid block type: {b.get('type')} — skipping")
                        return None
                    if not b.get("content", "").strip():
                        print(f"  ⚠️  Empty content in block {b.get('type')} — skipping")
                        return None

                return blocks

        except json.JSONDecodeError as e:
            print(f"  ⚠️  JSON parse error (attempt {attempt+1}): {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(RETRY_DELAYS[attempt])
        except httpx.HTTPStatusError as e:
            status = e.response.status_code
            print(f"  ⚠️  HTTP {status} (attempt {attempt+1})")
            if status in {429, 500, 502, 503} and attempt < MAX_RETRIES - 1:
                delay = RETRY_DELAYS[attempt]
                print(f"  ⏳ Retrying in {delay}s...")
                await asyncio.sleep(delay)
            else:
                return None
        except Exception as e:
            print(f"  ⚠️  Unexpected error: {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(RETRY_DELAYS[attempt])

    return None


# ─── Dataset generation ───────────────────────────────────────────────────────

async def generate(limit: Optional[int] = None, delay: float = 1.5) -> None:
    """Generate dataset by labeling seed prompts with Anthropic."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # Load already processed prompts to allow resuming
    already_done: set[str] = set()
    if RAW_FILE.exists():
        with open(RAW_FILE) as f:
            for line in f:
                try:
                    obj = json.loads(line)
                    already_done.add(obj["input"])
                except Exception:
                    pass

    prompts = get_all_prompts()
    if limit:
        prompts = prompts[:limit]

    to_process = [p for p in prompts if p["prompt"] not in already_done]
    print(f"📊 Total prompts: {len(prompts)}")
    print(f"✅ Already done: {len(already_done)}")
    print(f"⏳ To process: {len(to_process)}")
    print(f"🤖 Model: {MODEL}\n")

    if not to_process:
        print("Nothing to do — all prompts already processed.")
        return

    success = 0
    failed = 0

    with open(RAW_FILE, "a") as out:
        for i, item in enumerate(to_process, 1):
            prompt = item["prompt"]
            category = item["category"]
            short = prompt[:60].replace("\n", " ")
            print(f"[{i}/{len(to_process)}] [{category}] {short}…")

            blocks = await call_anthropic(prompt)

            if blocks is None:
                print(f"  ❌ Failed — skipping")
                failed += 1
            else:
                record = {
                    "input": prompt,
                    "output": json.dumps({"blocks": blocks}, ensure_ascii=False),
                    "category": category,
                    "n_blocks": len(blocks),
                    "block_types": [b["type"] for b in blocks],
                }
                out.write(json.dumps(record, ensure_ascii=False) + "\n")
                out.flush()
                print(f"  ✅ {len(blocks)} blocks: {', '.join(b['type'] for b in blocks)}")
                success += 1

            # Rate limit: ~40 req/min to stay under Anthropic free tier limits
            if i < len(to_process):
                await asyncio.sleep(delay)

    print(f"\n{'='*50}")
    print(f"✅ Success: {success} | ❌ Failed: {failed}")
    print(f"📁 Saved to: {RAW_FILE}")


# ─── Train/Val/Test split ─────────────────────────────────────────────────────

def split_dataset(train_ratio=0.8, val_ratio=0.1, seed=42) -> None:
    """Split raw.jsonl into train/val/test with stratification by category."""
    if not RAW_FILE.exists():
        print(f"❌ {RAW_FILE} not found — run generate first")
        return

    with open(RAW_FILE) as f:
        records = [json.loads(line) for line in f if line.strip()]

    print(f"📊 Total records: {len(records)}")

    # Stratify by category
    by_cat: dict[str, list] = {}
    for r in records:
        cat = r.get("category", "unknown")
        by_cat.setdefault(cat, []).append(r)

    random.seed(seed)
    train, val, test = [], [], []

    for cat, items in by_cat.items():
        random.shuffle(items)
        n = len(items)
        n_train = max(1, int(n * train_ratio))
        n_val = max(1, int(n * val_ratio))
        train.extend(items[:n_train])
        val.extend(items[n_train:n_train + n_val])
        test.extend(items[n_train + n_val:])

    random.shuffle(train)
    random.shuffle(val)
    random.shuffle(test)

    for split_name, split_data in [("train", train), ("val", val), ("test", test)]:
        path = DATA_DIR / f"{split_name}.jsonl"
        with open(path, "w") as f:
            for r in split_data:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")
        print(f"  📄 {split_name}.jsonl: {len(split_data)} examples")

    print(f"\n✅ Split complete → {DATA_DIR}/")


# ─── Stats ────────────────────────────────────────────────────────────────────

def print_stats() -> None:
    """Print dataset statistics."""
    if not RAW_FILE.exists():
        print("No raw.jsonl found.")
        return

    with open(RAW_FILE) as f:
        records = [json.loads(line) for line in f if line.strip()]

    print(f"📊 Dataset stats ({len(records)} examples)\n")

    # By category
    cats: dict[str, int] = {}
    block_type_counts: dict[str, int] = {}
    block_counts: list[int] = []

    for r in records:
        cats[r.get("category", "?")] = cats.get(r.get("category", "?"), 0) + 1
        block_counts.append(r.get("n_blocks", 0))
        for bt in r.get("block_types", []):
            block_type_counts[bt] = block_type_counts.get(bt, 0) + 1

    print("By category:")
    for cat, count in sorted(cats.items(), key=lambda x: -x[1]):
        print(f"  {cat:<20} {count}")

    print(f"\nBlocks per example: avg={sum(block_counts)/len(block_counts):.1f}, "
          f"min={min(block_counts)}, max={max(block_counts)}")

    print("\nBlock type frequency:")
    for bt, count in sorted(block_type_counts.items(), key=lambda x: -x[1]):
        pct = count / len(records) * 100
        print(f"  {bt:<20} {count:>4} ({pct:.0f}%)")


# ─── CLI ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate flompt decomposition dataset")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of prompts to process")
    parser.add_argument("--delay", type=float, default=1.5, help="Delay between API calls (seconds)")
    parser.add_argument("--split", action="store_true", help="Split raw.jsonl into train/val/test")
    parser.add_argument("--stats", action="store_true", help="Print dataset statistics")
    args = parser.parse_args()

    if args.stats:
        print_stats()
    elif args.split:
        split_dataset()
    else:
        asyncio.run(generate(limit=args.limit, delay=args.delay))

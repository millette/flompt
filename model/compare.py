"""
Benchmark: Anthropic Claude vs Fine-tuned FLAN-T5

Runs both models on the test set and compares:
  - Block type overlap (Jaccard similarity)
  - Latency (seconds per prompt)
  - Output validity (valid JSON, correct block types)
  - Side-by-side output diff

Usage:
    python compare.py                          # run on test.jsonl
    python compare.py --n 20                   # limit to 20 examples
    python compare.py --prompt "your prompt"   # single prompt comparison
    python compare.py --checkpoint path/to/model/final
"""

import os
import sys
import json
import time
import asyncio
import argparse
import statistics
from pathlib import Path
from typing import Optional

import httpx
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / "backend" / ".env")
sys.path.insert(0, str(ROOT / "backend"))

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
ANTHROPIC_MODEL = os.getenv("AI_MODEL", "claude-sonnet-4-20250514")

DATA_DIR = Path(__file__).parent / "dataset" / "data"
DEFAULT_CHECKPOINT = Path(__file__).parent / "checkpoints" / "flan-t5-base-flompt" / "final"

# Same system prompt as production
DECOMPOSE_SYSTEM_PROMPT = """You are a prompt engineering expert specializing in Claude AI best practices. Analyze the user's prompt and BUILD a structured workflow by decomposing it into typed blocks.

Block types available:
- role: The AI persona/role (who the AI should be)
- context: Background information and situational context
- objective: The main goal or task to accomplish
- input: Data or variables provided to the AI (code, text to analyze, etc.)
- document: External reference content for XML grounding
- constraints: Rules, restrictions, and limits
- output_format: Expected response format and structure
- format_control: Claude-specific formatting directives
- examples: Few-shot input/output pairs
- chain_of_thought: Explicit reasoning instructions
- language: The language the AI should respond in

Return ONLY valid JSON, no markdown:
{"blocks": [{"type": "<type>", "content": "<detailed content>", "summary": "<2-5 word label>"}]}

Rules:
- CONSTRUCT a proper workflow, don't just copy-paste
- ALWAYS include a "language" block
- Minimum 2 blocks, maximum 11 blocks"""


# ─── Anthropic inference ──────────────────────────────────────────────────────

async def anthropic_decompose(prompt: str) -> tuple[list[dict], float, bool]:
    """
    Call Anthropic API. Returns (blocks, latency_s, success).
    """
    t0 = time.time()
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": ANTHROPIC_MODEL,
                    "max_tokens": 16000,
                    "system": DECOMPOSE_SYSTEM_PROMPT,
                    "messages": [{"role": "user", "content": prompt}],
                }
            )
            resp.raise_for_status()
            text = resp.json()["content"][0]["text"].strip()
            if text.startswith("```"):
                text = text[text.index("\n") + 1:]
            if text.endswith("```"):
                text = text[:-3].strip()
            data = json.loads(text)
            blocks = data.get("blocks", [])
            return blocks, time.time() - t0, True
    except Exception as e:
        return [], time.time() - t0, False


# ─── FLAN-T5 inference ────────────────────────────────────────────────────────

def t5_decompose(model, prompt: str) -> tuple[list[dict], float, bool]:
    """Call local FLAN-T5 model. Returns (blocks, latency_s, success)."""
    t0 = time.time()
    try:
        blocks = model.decompose(prompt)
        return blocks, time.time() - t0, len(blocks) >= 2
    except Exception as e:
        return [], time.time() - t0, False


# ─── Metrics ──────────────────────────────────────────────────────────────────

def jaccard(set_a: set, set_b: set) -> float:
    """Jaccard similarity between two sets of block types."""
    if not set_a and not set_b:
        return 1.0
    union = set_a | set_b
    inter = set_a & set_b
    return len(inter) / len(union)


def type_precision_recall(predicted: set, ground_truth: set) -> tuple[float, float]:
    """Precision and recall for block type detection."""
    if not predicted:
        return 0.0, 0.0
    precision = len(predicted & ground_truth) / len(predicted)
    recall = len(predicted & ground_truth) / len(ground_truth) if ground_truth else 1.0
    return precision, recall


def score_example(
    predicted: list[dict],
    ground_truth: list[dict],
    success: bool,
) -> dict:
    """Compute all metrics for one example."""
    pred_types = {b["type"] for b in predicted}
    gt_types = {b["type"] for b in ground_truth}

    jaccard_score = jaccard(pred_types, gt_types)
    precision, recall = type_precision_recall(pred_types, gt_types)
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0

    return {
        "success": success,
        "n_blocks": len(predicted),
        "gt_n_blocks": len(ground_truth),
        "jaccard": jaccard_score,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "types_pred": sorted(pred_types),
        "types_gt": sorted(gt_types),
        "types_match": pred_types == gt_types,
    }


# ─── Reporting ────────────────────────────────────────────────────────────────

def print_header(title: str, width: int = 70) -> None:
    print(f"\n{'═' * width}")
    print(f"  {title}")
    print(f"{'═' * width}")


def print_side_by_side(prompt: str, anthropic_blocks: list, t5_blocks: list) -> None:
    """Print a side-by-side comparison for one prompt."""
    print(f"\n📝 Prompt: {prompt[:100]}{'…' if len(prompt) > 100 else ''}")
    print(f"{'─'*36} ANTHROPIC {'─'*36} FLAN-T5 {'─'*36}")

    max_rows = max(len(anthropic_blocks), len(t5_blocks))
    for i in range(max_rows):
        a = anthropic_blocks[i] if i < len(anthropic_blocks) else None
        t = t5_blocks[i] if i < len(t5_blocks) else None

        a_str = f"[{a['type'].upper():<18}] {a['content'][:30]}" if a else ""
        t_str = f"[{t['type'].upper():<18}] {t['content'][:30]}" if t else ""
        print(f"  {a_str:<52} │ {t_str}")


def print_aggregate_report(
    anthropic_scores: list[dict],
    t5_scores: list[dict],
    anthropic_latencies: list[float],
    t5_latencies: list[float],
) -> None:
    """Print final aggregate comparison table."""
    print_header("📊 AGGREGATE RESULTS")

    def avg(lst):
        return statistics.mean(lst) if lst else 0.0

    def pct(lst, key):
        vals = [s[key] for s in lst if s]
        return avg(vals) * 100

    rows = [
        ("Metric", "Anthropic", "FLAN-T5"),
        ("─" * 30, "─" * 12, "─" * 12),
        ("Success rate", f"{pct(anthropic_scores, 'success'):.0f}%", f"{pct(t5_scores, 'success'):.0f}%"),
        ("Exact type match", f"{pct(anthropic_scores, 'types_match'):.0f}%", f"{pct(t5_scores, 'types_match'):.0f}%"),
        ("Jaccard similarity", f"{pct(anthropic_scores, 'jaccard'):.0f}%", f"{pct(t5_scores, 'jaccard'):.0f}%"),
        ("Precision (types)", f"{pct(anthropic_scores, 'precision'):.0f}%", f"{pct(t5_scores, 'precision'):.0f}%"),
        ("Recall (types)", f"{pct(anthropic_scores, 'recall'):.0f}%", f"{pct(t5_scores, 'recall'):.0f}%"),
        ("F1 (types)", f"{pct(anthropic_scores, 'f1'):.0f}%", f"{pct(t5_scores, 'f1'):.0f}%"),
        ("Avg blocks / prompt", f"{avg([s['n_blocks'] for s in anthropic_scores]):.1f}", f"{avg([s['n_blocks'] for s in t5_scores]):.1f}"),
        ("─" * 30, "─" * 12, "─" * 12),
        ("Avg latency", f"{avg(anthropic_latencies):.2f}s", f"{avg(t5_latencies):.2f}s"),
        ("P50 latency", f"{statistics.median(anthropic_latencies):.2f}s" if anthropic_latencies else "—",
                        f"{statistics.median(t5_latencies):.2f}s" if t5_latencies else "—"),
        ("Min / Max latency",
         f"{min(anthropic_latencies):.2f}s / {max(anthropic_latencies):.2f}s" if anthropic_latencies else "—",
         f"{min(t5_latencies):.2f}s / {max(t5_latencies):.2f}s" if t5_latencies else "—"),
        ("Speedup (vs Anthropic)", "1×", f"{avg(anthropic_latencies)/avg(t5_latencies):.1f}×" if avg(t5_latencies) > 0 else "—"),
    ]

    for row in rows:
        print(f"  {row[0]:<30} {row[1]:<15} {row[2]}")


# ─── Main comparison ──────────────────────────────────────────────────────────

async def compare_on_test_set(
    checkpoint: str,
    n: Optional[int] = None,
    verbose: bool = False,
) -> None:
    """Run full benchmark on test.jsonl."""
    from inference import FlomptT5

    # Load test data
    test_path = DATA_DIR / "test.jsonl"
    if not test_path.exists():
        print(f"❌ test.jsonl not found in {DATA_DIR}")
        print("Run: python dataset/generate_dataset.py --split")
        return

    with open(test_path) as f:
        records = [json.loads(line) for line in f if line.strip()]

    if n:
        records = records[:n]

    print_header(f"🔬 BENCHMARK: Anthropic {ANTHROPIC_MODEL} vs Fine-tuned FLAN-T5")
    print(f"  Test examples: {len(records)}")
    print(f"  T5 checkpoint: {checkpoint}")

    # Load T5 model
    t5 = FlomptT5(checkpoint)
    t5._load()

    anthropic_scores, t5_scores = [], []
    anthropic_latencies, t5_latencies = [], []

    for i, record in enumerate(records, 1):
        prompt = record["input"]
        gt_blocks = json.loads(record["output"]).get("blocks", [])
        category = record.get("category", "?")

        print(f"\n[{i}/{len(records)}] [{category}] {prompt[:60]}…")

        # Anthropic
        a_blocks, a_lat, a_ok = await anthropic_decompose(prompt)
        a_score = score_example(a_blocks, gt_blocks, a_ok)
        anthropic_scores.append(a_score)
        anthropic_latencies.append(a_lat)
        print(f"  🤖 Anthropic: {len(a_blocks)} blocks, Jaccard={a_score['jaccard']:.2f}, {a_lat:.2f}s")

        # FLAN-T5
        t_blocks, t_lat, t_ok = t5_decompose(t5, prompt)
        t_score = score_example(t_blocks, gt_blocks, t_ok)
        t5_scores.append(t_score)
        t5_latencies.append(t_lat)
        print(f"  🟦 FLAN-T5:   {len(t_blocks)} blocks, Jaccard={t_score['jaccard']:.2f}, {t_lat:.2f}s")

        if verbose:
            print_side_by_side(prompt, a_blocks, t_blocks)

        # Rate limit on Anthropic side
        if i < len(records):
            await asyncio.sleep(1.5)

    print_aggregate_report(anthropic_scores, t5_scores, anthropic_latencies, t5_latencies)

    # Save results
    results_path = Path(__file__).parent / "benchmark_results.json"
    with open(results_path, "w") as f:
        json.dump({
            "anthropic_model": ANTHROPIC_MODEL,
            "t5_checkpoint": str(checkpoint),
            "n_examples": len(records),
            "anthropic": {
                "scores": anthropic_scores,
                "latencies": anthropic_latencies,
            },
            "t5": {
                "scores": t5_scores,
                "latencies": t5_latencies,
            },
        }, f, indent=2)
    print(f"\n📁 Results saved to {results_path}")


async def compare_single_prompt(prompt: str, checkpoint: str) -> None:
    """Compare both models on a single prompt (no ground truth)."""
    from inference import FlomptT5

    print_header(f"🔬 SINGLE PROMPT COMPARISON")
    print(f"  Prompt: {prompt[:100]}")
    print(f"  T5 checkpoint: {checkpoint}\n")

    t5 = FlomptT5(checkpoint)

    # Run both
    print("🤖 Calling Anthropic…")
    a_blocks, a_lat, a_ok = await anthropic_decompose(prompt)

    print("🟦 Running FLAN-T5…")
    t_blocks, t_lat, t_ok = t5_decompose(t5, prompt)

    # Display
    print(f"\n{'─'*70}")
    print(f"  ANTHROPIC ({a_lat:.2f}s) — {len(a_blocks)} blocks")
    print(f"{'─'*70}")
    for b in a_blocks:
        print(f"  [{b['type'].upper():<18}] {b['content'][:70]}")

    print(f"\n{'─'*70}")
    print(f"  FLAN-T5 ({t_lat:.2f}s) — {len(t_blocks)} blocks")
    print(f"{'─'*70}")
    for b in t_blocks:
        print(f"  [{b['type'].upper():<18}] {b['content'][:70]}")

    # Overlap
    a_types = {b["type"] for b in a_blocks}
    t_types = {b["type"] for b in t_blocks}
    j = jaccard(a_types, t_types)
    print(f"\n📊 Block type Jaccard similarity: {j:.2%}")
    print(f"  Anthropic types: {', '.join(sorted(a_types))}")
    print(f"  FLAN-T5 types:   {', '.join(sorted(t_types))}")
    print(f"  In common: {', '.join(sorted(a_types & t_types))}")
    if a_types - t_types:
        print(f"  Only Anthropic: {', '.join(sorted(a_types - t_types))}")
    if t_types - a_types:
        print(f"  Only FLAN-T5:   {', '.join(sorted(t_types - a_types))}")

    print(f"\n⚡ Speed: FLAN-T5 is {a_lat/t_lat:.1f}× {'faster' if t_lat < a_lat else 'slower'} than Anthropic")


# ─── CLI ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Benchmark Anthropic vs FLAN-T5")
    parser.add_argument("--checkpoint", default=str(DEFAULT_CHECKPOINT),
                        help="Path to fine-tuned FLAN-T5 checkpoint")
    parser.add_argument("--n", type=int, default=None, help="Limit test examples")
    parser.add_argument("--verbose", action="store_true", help="Show side-by-side outputs")
    parser.add_argument("--prompt", type=str, default=None,
                        help="Run on a single prompt instead of test set")
    args = parser.parse_args()

    if args.prompt:
        asyncio.run(compare_single_prompt(args.prompt, args.checkpoint))
    else:
        asyncio.run(compare_on_test_set(
            checkpoint=args.checkpoint,
            n=args.n,
            verbose=args.verbose,
        ))

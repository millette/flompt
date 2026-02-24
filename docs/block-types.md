# Block Types

flompt organizes prompts into **9 semantic block types**, each representing a distinct aspect of a well-structured AI prompt. Together, they cover every dimension of modern prompt engineering.

---

## Role

Defines the AI persona or expertise.

**Examples:** `"You are an expert Python developer"`, `"Act as a senior product manager"`

Color: violet `#c084fc`

---

## Context

Provides background information and situational context that the AI needs to understand the task. This is the "why" behind the objective.

Color: slate `#94a3b8`

---

## Objective

Defines the main goal or task. This is the core of your prompt — what you want the AI to accomplish.

**Examples:** `"Your goal is to..."`, `"You must analyze..."`

Color: amber `#fbbf24`

---

## Input

The actual data, variables, or content provided to the AI. Separating input from objective keeps prompts clean and reusable — you can swap the input without rewriting the whole prompt.

Color: green `#4ade80`

---

## Constraints

Rules, limitations, or guardrails for the AI.

**Examples:** `"Do not use bullet points"`, `"Never exceed 300 words"`, `"Only use information provided in the input"`

Color: rose `#fb7185`

---

## Output Format

Specifies the expected response structure — JSON, bullet list, table, numbered steps, prose, markdown, etc.

Color: accent `#ff6b9d`

---

## Examples

Few-shot demonstrations: input/output pairs that show the AI exactly what you expect. This is one of the most powerful techniques in prompt engineering — dramatically improves consistency and reduces ambiguity.

Color: violet-light `#c4b5fd`

---

## Chain of Thought

Instructs the AI to reason step by step before answering. Improves accuracy on complex or multi-step tasks.

**Example:** `"Think step by step before answering"`, `"First, identify the problem. Then..."`

Color: cyan `#67e8f9`

---

## Language

Specifies the language for the AI's response. Auto-detected on decomposition based on your prompt's language, but can be overridden manually via a dropdown.

Color: sky `#38bdf8`

---

> **Tip:** Each block shows a color-coded header and an AI-generated 2-5 word summary — so your canvas stays readable even with many blocks.

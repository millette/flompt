# How It Works

flompt follows a three-step loop: **Decompose → Edit → Compile**.

---

## Step 1: Decompose

Paste any raw prompt into the input panel and click **Decompose into blocks**.

flompt sends your prompt to the backend (FastAPI), which calls Claude to analyze it and split it into semantic blocks. Each block is:

- Assigned a **type** (Role, Context, Objective…)
- Given a **2-5 word AI-generated summary** for quick identification
- **Auto-positioned** on the canvas (180px vertical spacing)

Blocks are auto-connected top-to-bottom to represent reading order. A **Language block** is added automatically based on the detected language of your prompt.

```
User input: "You are a Python expert. Write a function that sorts a list of
dictionaries by a given key. Return only code, no explanations."

→ Role:          "You are a Python expert"
→ Objective:     "Write a function that sorts a list of dictionaries by a given key"
→ Constraints:   "Return only code, no explanations"
→ Language:      English
```

---

## Step 2: Edit Visually

Once on the canvas, you have full control:

| Action | How |
|---|---|
| **Reposition** a block | Drag it anywhere on the canvas |
| **Connect** two blocks | Click the bottom handle of one, then the top handle of another |
| **Edit content** | Click on any block — a textarea opens and auto-resizes |
| **Add a block** | Click a block type in the sidebar |
| **Delete a block** | Click the × button or press `Delete` |
| **Undo / Redo** | `Ctrl+Z` / `Ctrl+Y` (last 30 states) |

The canvas uses a **20px snap-to-grid** and supports a minimap for large flows.

---

## Step 3: Compile

Click **Compile** in the output panel. The backend sends your ordered blocks to Claude, which:

1. Sorts blocks in canonical order (role → context → objective → input → constraints → output format → examples → chain of thought → language)
2. Optimizes for conciseness without losing semantics
3. Wraps sections in **XML-style tags** for machine readability
4. Returns a single optimized prompt + estimated token count

```xml
<role>Python expert</role>
<objective>Write a function that sorts a list of dictionaries by a given key</objective>
<constraints>Return only code, no explanations</constraints>
<language>English</language>
```

### Export options

After compiling, you can:

- **Copy** to clipboard
- **Download as `.txt`**
- **Export as `.json`** — full session export (nodes, edges, compiled output)
- **Share** via native browser share API (if supported)

---

> **No AI key?** flompt falls back to a keyword-based heuristic decomposer and a structural XML compiler — both fully functional without any API key configured.

# How It Works

flompt follows a three-step loop: **Decompose → Edit → Assemble**.

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

## Step 3: Assemble

Click **Assemble prompt** in the output panel. The assembly is **100% local** — no API call, no latency.

**Block ordering algorithm:**
1. If edges (connections) exist → topological sort (Kahn's algorithm)
2. Otherwise → sort by `position.y` (top to bottom on canvas)

**Output format — structured XML:**

```xml
<prompt>
  <role>Python expert</role>
  <objective>Write a function that sorts a list of dictionaries by a given key</objective>
  <constraints>Return only code, no explanations</constraints>
  <language>English</language>
</prompt>
```

XML tags act as explicit semantic delimiters — modern LLMs (GPT-4, Claude, Gemini) parse them reliably. Anthropic recommends XML tags in their official prompt engineering guidelines.

Special characters (`&`, `<`, `>`, `"`, `'`) are automatically escaped in block content.

### Export options

After assembling, you can:

- **Copy** to clipboard
- **Download as `.txt`**
- **Export as `.json`** — full session export (nodes, edges, assembled output)
- **Share** via native browser share API (if supported)
- **Send to AI** *(extension only)* — inject directly into the active AI chat

---

## Chrome Extension

The Chrome extension brings flompt directly into ChatGPT, Claude, and Gemini as a sidebar.

### Installation

1. Download the `.zip` from [GitHub releases](https://github.com/Nyrok/flompt)
2. Open `chrome://extensions/` → enable **Developer mode**
3. Click **Load unpacked** → select the extracted folder
4. Navigate to ChatGPT, Claude, or Gemini — the Flompt button appears in the input toolbar

### How it works

- The **Flompt button** is injected just before the send button in each platform's toolbar
- Clicking it opens the sidebar (440px, slides in from the right)
- The app loads inside a sandboxed `<iframe>` at `flompt.dev/app/?extension=1`
- When you click **Send to AI**, the assembled XML prompt is sent via `postMessage` to the content script, which injects it into the platform's `contenteditable` input
- The sidebar header is hidden in extension mode to maximize canvas space

### Supported platforms

| Platform | Input selector | Send button |
|---|---|---|
| ChatGPT | `#prompt-textarea[contenteditable]` | `button[data-testid="send-button"]` |
| Claude | `div[contenteditable].ProseMirror` | `button[aria-label="Send Message"]` |
| Gemini | `rich-textarea div[contenteditable]` | `button.send-button` |

If platform-specific selectors fail (interface update), a DOM traversal algorithm walks up from the input element (up to 12 levels) to find the send button. Fallback: floating button bottom-right.

---

> **No AI key for decomposition?** flompt falls back to a keyword-based heuristic decomposer — fully functional without any API key configured.

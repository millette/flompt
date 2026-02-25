<p align="center">
  <img src="app/public/favicon.svg" width="80" height="80" alt="flompt logo" />
</p>

<h1 align="center">flompt</h1>

<p align="center">
  <strong>flow + prompt = flompt</strong><br/>
  Turn any AI prompt into a visual flow. Decompose, edit as a flowchart, recompile.
</p>

<p align="center">
  <a href="https://flompt.dev"><img src="https://img.shields.io/badge/🌐_Live-flompt.dev-FF3570?style=for-the-badge" alt="Live Demo" /></a>
  <a href="https://github.com/Nyrok/flompt/stargazers"><img src="https://img.shields.io/github/stars/Nyrok/flompt?style=for-the-badge&color=FF3570" alt="Stars" /></a>
  <a href="https://github.com/Nyrok/flompt/blob/master/LICENSE"><img src="https://img.shields.io/github/license/Nyrok/flompt?style=for-the-badge" alt="License" /></a>
</p>

<p align="center">
  <a href="https://github.com/Nyrok/flompt"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://github.com/Nyrok/flompt"><img src="https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" /></a>
  <a href="https://github.com/Nyrok/flompt"><img src="https://img.shields.io/badge/React_Flow-FF0072?style=flat-square&logo=reactflow&logoColor=white" alt="React Flow" /></a>
  <a href="https://github.com/Nyrok/flompt"><img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" /></a>
  <a href="https://github.com/Nyrok/flompt"><img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" /></a>
</p>

---

## ✨ What is flompt?

**flompt** is a visual prompt engineering tool that transforms how you write AI prompts.

Instead of writing one long block of text, flompt lets you:

1. **Decompose** — Paste any prompt and let AI break it into structured blocks
2. **Edit visually** — Drag, connect, and reorder blocks in a flowchart editor
3. **Recompile** — Generate a Claude-optimized, machine-ready prompt from your flow

> Think of it as **Figma for prompts** — visual, structured, and built for Claude.

## 🧩 Block Types

11 specialized blocks that map directly to Claude's prompt engineering best practices:

| Block | Purpose | Claude XML |
|-------|---------|-----------|
| **Role** | AI persona & expertise | `<role>` |
| **Context** | Background information | `<context>` |
| **Objective** | What you want to achieve | `<objective>` |
| **Input** | Data you're providing | `<input>` |
| **Constraints** | Rules & limitations | `<constraints>` |
| **Output Format** | Expected output structure | `<output_format>` |
| **Examples** | Few-shot demonstrations | `<examples><example>` |
| **Chain of Thought** | Reasoning steps | `<thinking>` |
| **Document** | External content grounding | `<documents><document>` |
| **Format Control** | Claude-specific directives (tone, verbosity, markdown) | `<format_instructions>` |
| **Language** | Response language | `<language>` |

Blocks are automatically ordered following Anthropic's recommended prompt structure.

## 🚀 Try It Now

**[→ flompt.dev](https://flompt.dev)** — No account needed. Free & open-source.

## 🧩 Chrome Extension

Use flompt directly inside ChatGPT, Claude, and Gemini — without leaving your tab.

- **✦ Enhance** button injected into the AI chat input
- Bidirectional sync between the sidebar and the chat
- Works on ChatGPT · Claude · Gemini

[→ Download from GitHub Releases](https://github.com/Nyrok/flompt/releases)

## 🛠️ Self-Hosting

### Requirements

- Python 3.12+
- Node.js 18+
- An Anthropic or OpenAI API key *(optional — heuristic fallback works without one)*

### Manual Setup

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Add your API key
uvicorn app.main:app --reload --port 8000
```

**App (Frontend)**
```bash
cd app
cp .env.example .env  # Optional: add PostHog key for analytics
npm install
npm run dev
```

| Service | URL |
|---------|-----|
| App | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

## ⚙️ AI Configuration

flompt supports multiple AI providers. Copy `backend/.env.example` to `backend/.env`:

```env
# Anthropic (recommended)
ANTHROPIC_API_KEY=sk-ant-...
AI_PROVIDER=anthropic
AI_MODEL=claude-3-5-haiku-20241022

# or OpenAI
OPENAI_API_KEY=sk-...
AI_PROVIDER=openai
AI_MODEL=gpt-4o-mini
```

**No API key?** No problem — flompt falls back to a heuristic decomposer (keyword-based) and structured XML compilation.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, React Flow v11, Zustand, Vite |
| **Backend** | FastAPI, Python 3.12, Uvicorn |
| **AI** | Anthropic Claude / OpenAI GPT (pluggable) |
| **Reverse Proxy** | Caddy (auto-TLS via Let's Encrypt) |
| **Extension** | Chrome MV3 (content script + sidebar) |
| **i18n** | English & French |

## 🌍 Features

- 🎨 **Visual flowchart editor** — Drag-and-drop blocks with React Flow
- 🤖 **AI-powered decomposition** — Paste a prompt, get structured blocks
- ⚡ **Async job queue** — Non-blocking decomposition with live progress tracking
- 🦾 **Claude-optimized output** — XML structured following Anthropic best practices
- 🧩 **Chrome extension** — Enhance button inside ChatGPT, Claude & Gemini
- 📱 **Responsive** — Full touch support, tap-to-connect
- 🌙 **Dark theme** — Mermaid-inspired warm dark UI
- 🌐 **Bilingual** — English & French interface
- 💾 **Auto-save** — Local persistence with Zustand
- ⌨️ **Keyboard shortcuts** — Power-user friendly
- 📋 **Export** — Copy, download as TXT or JSON
- 🔓 **Open-source** — MIT licensed, self-hostable

## 📄 License

[MIT](LICENSE) — Built by [Nyrok](https://github.com/Nyrok)

---

<p align="center">
  <strong>⭐ Star this repo if flompt helps you write better prompts!</strong>
</p>

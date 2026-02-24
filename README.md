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
2. **Edit visually** — Drag, connect, and edit blocks in a flowchart editor
3. **Recompile** — Generate an optimized, machine-ready prompt from your flow

> Think of it as **Figma for prompts** — visual, structured, and powerful.

## 🧩 Block Types

Each prompt is decomposed into specialized blocks that map to prompt engineering best practices:

| Block | Purpose | Shape |
|-------|---------|-------|
| **Role** | AI persona & expertise | ⬡ Hexagon |
| **Context** | Background information | ▱ Parallelogram |
| **Objective** | What you want to achieve | ▐▌ Bold rectangle |
| **Input** | Data you're providing | ⌒ Rounded top |
| **Constraints** | Rules & limitations | ⯃ Octagon |
| **Output Format** | Expected output structure | ⌓ Rounded bottom |
| **Examples** | Few-shot demonstrations | ┊┊ Dashed borders |
| **Chain of Thought** | Reasoning steps | ⬭ Rounded rect |

## 🚀 Try It Now

**[→ flompt.dev](https://flompt.dev)** — No account needed. Free & open-source.

## 🛠️ Self-Hosting

### With Docker

```bash
git clone https://github.com/Nyrok/flompt.git
cd flompt
cp backend/.env.example backend/.env
# Add your API key to backend/.env
docker compose up
```

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
npm install
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

## ⚙️ AI Configuration

flompt supports multiple AI providers. Copy `backend/.env.example` to `backend/.env`:

```env
ANTHROPIC_API_KEY=sk-ant-...
# or
OPENAI_API_KEY=sk-...
```

**No API key?** No problem — flompt falls back to a heuristic decomposer (keyword-based) and structured XML compilation.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, React Flow v11, Zustand, Vite |
| **Backend** | FastAPI, Python 3.12, Uvicorn |
| **AI** | Anthropic Claude / OpenAI GPT (pluggable) |
| **Reverse Proxy** | Caddy (auto-TLS via Let's Encrypt) |
| **i18n** | English & French |

## 🌍 Features

- 🎨 **Visual flowchart editor** — Drag-and-drop blocks with React Flow
- 🤖 **AI-powered decomposition** — Paste a prompt, get structured blocks
- ⚡ **Instant recompilation** — Blocks → optimized machine-ready prompt
- 📱 **Mobile-first** — Full touch support, tap-to-connect, responsive design
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

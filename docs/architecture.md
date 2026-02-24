# Architecture

flompt is a monorepo with four main components, served through a single Caddy reverse proxy.

---

## Monorepo structure

```
flompt/
├── app/                # Vite React SPA (prompt builder)
│   ├── src/
│   │   ├── components/ # FlowCanvas, BlockNode, Sidebar, PromptInput, PromptOutput…
│   │   ├── store/      # Zustand global state (flowStore.ts)
│   │   ├── services/   # Axios API client (api.ts)
│   │   ├── types/      # TypeScript interfaces + block metadata (blocks.ts)
│   │   └── i18n/       # EN/FR translations + LocaleContext
│   └── dist/           # Production build (gitignored)
├── blog/               # Next.js 15 blog (static export, bilingual FR/EN)
│   ├── content/        # Markdown posts (fr/ + en/)
│   └── out/            # Static export (gitignored)
├── landing/            # Static landing page (HTML/CSS, no build)
├── backend/            # FastAPI backend
│   └── app/
│       ├── main.py     # App setup, CORS, routers
│       ├── models/     # Pydantic models
│       ├── routers/    # /decompose, /compile endpoints
│       └── services/   # ai_service, decomposer, compiler
├── docs/               # This documentation (GitBook sync)
└── Caddyfile           # Reverse proxy config
```

---

## Request routing (Caddy)

```
Browser → flompt.dev (Caddy :443, auto-TLS)
  /           → landing/index.html      (static)
  /app*       → app/dist/               (Vite SPA, strips /app prefix)
  /blog*      → blog/out/               (Next.js static, strips /blog prefix)
  /api/*      → FastAPI :8000           (reverse proxy)
  /health     → FastAPI :8000/health
  /docs*      → GitBook                 (reverse proxy)
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/decompose` | Raw prompt → nodes + edges (React Flow format) |
| `POST` | `/api/compile` | Blocks array → optimized prompt + token estimate |
| `GET` | `/health` | `{ status: "ok", service: "flompt-api" }` |

### Decompose request/response

```json
// Request
{ "prompt": "You are a Python expert. Write a sorting function." }

// Response
{
  "nodes": [
    { "id": "1", "type": "block", "position": { "x": 100, "y": 50 },
      "data": { "type": "role", "content": "You are a Python expert", "summary": "Python expert role" } }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2" }
  ]
}
```

### Compile request/response

```json
// Request
{ "blocks": [{ "type": "role", "content": "Python expert", ... }] }

// Response
{
  "raw": "<role>Python expert</role>\n<objective>...</objective>",
  "tokenEstimate": 42,
  "blocks": [...]
}
```

---

## AI Service

The AI service (`backend/app/services/ai_service.py`) is pluggable:

| Provider | Default model | Config key |
|---|---|---|
| **Anthropic Claude** | `claude-sonnet-4-20250514` | `ANTHROPIC_API_KEY` |
| **OpenAI GPT** | `gpt-4o-mini` | `OPENAI_API_KEY` |

**Retry logic:** 3 attempts, exponential backoff (2s → 5s → 10s). Retryable on HTTP 429, 500, 502, 503, 529.

**Fallback (no key):** keyword-based heuristic decomposer + structural XML compiler.

---

## Frontend state (Zustand)

```typescript
interface FlowState {
  nodes: FlomptNode[]           // React Flow nodes
  edges: FlomptEdge[]           // React Flow edges
  rawPrompt: string             // Original input
  compiledPrompt: CompiledPrompt | null
  isDecomposing: boolean
  isCompiling: boolean
  past: Snapshot[]              // Undo history (last 30)
  future: Snapshot[]            // Redo history
  activeTab: 'input' | 'canvas' | 'output'
}
```

**Persistence:** Zustand `persist` middleware → localStorage key `flompt-session`. Session survives page reload.

---

## CORS

The backend allows requests from:
- `http://localhost:3000` (dev)
- `https://flompt.dev`
- `http://flompt.dev`

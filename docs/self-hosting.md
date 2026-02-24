# Self-Hosting

flompt is **MIT licensed** and fully self-hostable. No account required, no telemetry, no lock-in.

---

## Quick start with Docker

```bash
git clone https://github.com/Nyrok/flompt.git
cd flompt
cp backend/.env.example backend/.env
# Add your ANTHROPIC_API_KEY or OPENAI_API_KEY to backend/.env
docker compose up
```

The app will be available at `http://localhost:3000`.

---

## Manual setup

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # Add your API key
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend (Vite React SPA)

```bash
cd app
npm install
npm run dev    # Development → http://localhost:3000
npm run build  # Production build → dist/
```

### 3. Blog (Next.js, optional)

```bash
cd blog
npm install
npm run build  # Static export → out/
```

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | No* | — | Anthropic Claude API key |
| `OPENAI_API_KEY` | No* | — | OpenAI API key (alternative) |
| `AI_PROVIDER` | No | `anthropic` | `anthropic` or `openai` |
| `AI_MODEL` | No | `claude-sonnet-4-20250514` | Override the AI model |

\* At least one API key is recommended. Without one, flompt uses the built-in heuristic fallback.

---

## Production with Caddy

For production, flompt uses [Caddy](https://caddyserver.com/) as a reverse proxy with automatic TLS.

```caddyfile
flompt.dev {
    handle_path /blog* {
        root * /path/to/flompt/blog/out
        try_files {path} {path}.html {path}/index.html /index.html
        file_server
    }
    handle /api/* {
        reverse_proxy 127.0.0.1:8000
    }
    handle_path /app* {
        root * /path/to/flompt/app/dist
        try_files {path} /index.html
        file_server
    }
    handle {
        root * /path/to/flompt/landing
        file_server
    }
}
```

Start Caddy:

```bash
./caddy start --config Caddyfile
```

---

## No API key? No problem.

flompt includes a **built-in fallback** that works without any AI provider:

- **Decompose fallback:** Keyword-based heuristic detection. Scans your prompt for role indicators, constraint language, format keywords, etc. and assigns block types accordingly.
- **Compile fallback:** Structural XML compilation. Sorts blocks in canonical order and wraps them in XML tags — instant, deterministic, no API call needed.

The fallback produces good results for common prompt patterns and is perfect for local/offline use.

---

## Contributing

Pull requests welcome at [github.com/Nyrok/flompt](https://github.com/Nyrok/flompt).

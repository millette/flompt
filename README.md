# flompt

**Visual Prompt Builder** — Décompose, édite en flowchart, recompile en prompt machine-readable optimisé.

## Concept

```
Prompt brut → [IA décompose] → Flowchart éditable → [Validation] → Prompt optimisé AI-to-AI
```

## Stack

| Couche | Tech |
|--------|------|
| Frontend | React 18 + TypeScript + React Flow + Zustand |
| Backend | FastAPI (Python 3.12) |
| AI | Anthropic / OpenAI (pluggable) |
| Infra | Docker Compose |

## Blocs disponibles

| Bloc | Rôle |
|------|------|
| `Role` | Persona de l'IA |
| `Context` | Contexte de la tâche |
| `Objective` | Ce qu'on veut accomplir |
| `Input` | Données fournies |
| `Constraints` | Règles et limites |
| `Output Format` | Format de sortie attendu |
| `Examples` | Few-shot examples |
| `Chain of Thought` | Étapes de raisonnement |

## Lancement rapide

### Avec Docker

```bash
cp backend/.env.example backend/.env
# Remplir la clé API dans backend/.env
docker compose up
```

### Sans Docker

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # puis remplir la clé API
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

- Frontend : http://localhost:3000
- Backend API : http://localhost:8000
- Docs API : http://localhost:8000/docs

## Configuration IA

Copier `backend/.env.example` en `backend/.env` et renseigner :

```env
ANTHROPIC_API_KEY=sk-ant-...
# ou
OPENAI_API_KEY=sk-...
```

Sans clé API : fallback heuristique (décomposition par keywords) + compilation XML structurée.

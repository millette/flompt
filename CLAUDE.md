# CLAUDE.md — flompt

## Identité du projet
- **flompt** = flow + prompt — Visual AI Prompt Builder
- **URL** : https://flompt.dev
- **Repo legacy** : https://github.com/Nyrok/flompt-legacy (monorepo original, renommé)
- **Organisation** : https://github.com/flompt (à créer — 5 repos séparés prévus)
- **Git email** : nyrokgaming1@gmail.com

## Stack
- **App** : React 18 + TypeScript + React Flow v11 + Zustand + Vite (SPA dans `/app`)
- **Blog** : Next.js 15 + Tailwind CSS (static export dans `/blog`, bilingual FR/EN)
- **Landing** : HTML statique (dans `/landing`)
- **Backend** : FastAPI + Uvicorn (Python 3.12, port 8000)
- **Reverse Proxy** : Caddy (auto-TLS Let's Encrypt, port 443)
- **IA** : Anthropic Claude (pluggable, via httpx)
- **i18n** : FR/EN via LocaleContext (app) + fichiers markdown (blog)

## Architecture déploiement
```
flompt.dev/
├── /           → landing/index.html (static, catch-all)
├── /app*       → app/dist/ (Vite SPA, handle_path strips /app)
├── /blog*      → blog/out/ (Next.js static export, handle_path strips /blog)
├── /api/*      → FastAPI :8000 (reverse_proxy)
└── /health     → FastAPI :8000 (reverse_proxy)
```

## Structure du monorepo
```
/projects/flompt/
├── app/           # Vite React SPA (prompt builder)
│   ├── src/       # React components, styles, store
│   ├── dist/      # Production build (gitignored)
│   └── index.html # Entry point (base: /app)
├── blog/          # Next.js blog (static export)
│   ├── src/       # Pages, components, i18n
│   ├── content/   # Markdown posts (fr/ + en/)
│   ├── out/       # Static export (gitignored)
│   └── next.config.ts  # basePath: /blog, output: export
├── landing/       # Static landing page
│   └── index.html
├── backend/       # FastAPI backend
│   ├── app/
│   └── .venv/
├── Caddyfile      # Reverse proxy config
├── caddy          # Caddy binary (gitignored, 50MB)
└── CLAUDE.md      # This file
```

## Commandes
```bash
# App build (production)
cd /projects/flompt/app && npm run build

# Blog build (static export → out/)
cd /projects/flompt/blog && rm -rf .next && npm run build

# Backend
cd /projects/flompt/backend && .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000

# Caddy
cd /projects/flompt && ./caddy start --config Caddyfile
./caddy reload --config /projects/flompt/Caddyfile
./caddy stop

# Full redeploy
cd /projects/flompt/app && npm run build
cd /projects/flompt/blog && rm -rf .next && npm run build
./caddy reload --config /projects/flompt/Caddyfile

# Vérification santé
curl -sk -o /dev/null -w "%{http_code}" https://flompt.dev/
curl -sk -o /dev/null -w "%{http_code}" https://flompt.dev/app
curl -sk -o /dev/null -w "%{http_code}" https://flompt.dev/blog/en
curl -sk -o /dev/null -w "%{http_code}" https://flompt.dev/health
```

---

## Design / Branding
- **Logo** : pas d'icône, le titre "flompt" en font Caveat (handwritten) suffit
- **Font titre** : `Caveat` (Google Fonts), 700, couleur accent + glow
- **Font body** : `Inter` (Google Fonts)
- **Accent** : #FF3570 (app) / #ff4d82 (landing+blog)
- **Accent glow** : `text-shadow: 0 0 10px var(--accent-glow)`
- **Theme** : Mermaid-inspired dark (#1c1c1e)
- **Tagline** : "flow + prompt = flompt"
- **Langue SEO** : anglais (html lang="en", OG locale en_US)

---

## Règles de travail pour Noryk

### 1. Avant de modifier du CSS
- **Toujours vérifier la cascade** : les styles desktop déclarés APRÈS un media query mobile les écrasent
- **Mettre les overrides mobile en dernier** ou juste après le bloc qu'ils overrident
- **Ne jamais changer width/height pour resizer un élément positionné** → utiliser `transform: scale()`
- Les `!important` dans le code React Flow sont nécessaires car RF injecte ses propres styles inline

### 2. Avant de modifier le Caddyfile
- **Les `handle` spécifiques DOIVENT être avant le `handle` catch-all** (landing)
- Utiliser `handle_path` (pas `handle` + `uri strip_prefix`) pour les sous-chemins (/app, /blog)
- `handle_path /app*` strip automatiquement le prefix `/app` du path
- **Après chaque modif Caddy**, tester : landing `/`, app `/app`, blog `/blog/en`, health `/health`

### 3. Blog — Export statique
- Le blog utilise `output: "export"` → génère des fichiers statiques dans `out/`
- **PAS de serveur Node en prod** — Caddy sert les fichiers directement
- `basePath: "/blog"` → les assets dans le HTML sont préfixés `/blog/_next/...`
- `handle_path /blog*` strip `/blog`, les fichiers sont trouvés dans `out/_next/...`
- Après chaque modif blog : `rm -rf .next && npm run build` puis vérifier les assets CSS/JS

### 4. Avant de toucher aux handles React Flow
- Les handles sont positionnés par React Flow avec `position: absolute` + `top`/`left`
- Pour changer la taille sans décaler → utiliser `transform: scale()`
- `connectOnClick={true}` + `ConnectionMode.Loose` = on clique source puis target, pas de drag

### 5. Comprendre l'intention avant d'agir
- **Si la demande est ambiguë sur le QUOI** (pas le comment) → demander une clarification
- **Règle** : si un changement est destructif ou structurel (swap de types, refacto d'architecture), confirmer l'intention

### 6. Avant de git add
- **Vérifier le `.gitignore`** — `*.png`, `caddy`, `dist/`, `.next/`, `node_modules/` sont ignorés
- Pour les images dans `app/public/`, utiliser `git add -f`
- Ne jamais commit le binaire `caddy` (50MB)
- Ne jamais commit `.env`, `credentials.json`

### 7. Après chaque modification
1. Build l'app/blog selon ce qui a changé
2. Vérifier les routes via curl (landing, app, blog, health)
3. Ne jamais dire "c'est fait" sans avoir vérifié

### 8. Organisation GitHub (en cours)
- Objectif : créer org `flompt` avec 5 repos : app, blog, landing, backend, deploy
- Le repo `deploy` contiendra des git submodules vers les 4 autres
- Le repo `Nyrok/flompt-legacy` est le monorepo original renommé temporairement

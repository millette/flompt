# CLAUDE.md — flompt

## Identité du projet
- **flompt** = flow + prompt — Visual AI Prompt Builder
- **URL** : https://flompt.dev
- **Repo** : https://github.com/Nyrok/flompt
- **Git email** : nyrokgaming1@gmail.com

## Stack
- **Frontend** : React 18 + TypeScript + React Flow v11 + Zustand + Vite
- **Backend** : FastAPI + Uvicorn (Python 3.12, port 8000)
- **Reverse Proxy** : Caddy (auto-TLS Let's Encrypt, port 443)
- **IA** : Anthropic Claude (pluggable, via httpx)
- **i18n** : FR/EN via LocaleContext

## Architecture déploiement
```
Caddy (:443) → /api/* et /health → FastAPI (:8000)
             → /* → frontend/dist (SPA fallback)
```

## Commandes
```bash
# Frontend build (production)
cd /projects/flompt/frontend && npx vite build

# Backend
cd /projects/flompt/backend && .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000

# Caddy
cd /projects/flompt && ./caddy run --config Caddyfile

# Reload Caddy sans restart
curl -s -X POST http://localhost:2019/load -H "Content-Type: text/caddyfile" --data-binary @/projects/flompt/Caddyfile

# Vérification santé
curl -sk -o /dev/null -w "%{http_code}" https://flompt.dev/
curl -sk -o /dev/null -w "%{http_code}" https://flompt.dev/health
curl -sk -X POST https://flompt.dev/api/decompose -H "Content-Type: application/json" -d '{"prompt":"test"}'
```

---

## Règles de travail pour Noryk

### 1. Avant de modifier du CSS
- **Toujours vérifier la cascade** : les styles desktop déclarés APRÈS un media query mobile les écrasent (même spécificité + ordre de déclaration = le dernier gagne)
- **Mettre les overrides mobile en dernier** ou juste après le bloc qu'ils overrident
- **Ne jamais changer width/height pour resizer un élément positionné** (handles, boutons absolus) → utiliser `transform: scale()` qui garde le centre
- **Si tu changes une dimension** → toujours vérifier le centrage (top/bottom/left offsets, translate)
- Les `!important` dans le code React Flow sont nécessaires car RF injecte ses propres styles inline

### 2. Avant de modifier le Caddyfile
- **Les `handle` spécifiques DOIVENT être avant le `handle` catch-all** (le frontend SPA)
- **Ne jamais mettre `root` + `file_server` + `try_files` à la racine** du bloc Caddy, sinon ça intercepte tout y compris /api/*
- Toujours mettre le frontend dans `handle { }` (sans matcher = catch-all, exécuté en dernier)
- **Après chaque modif Caddy**, tester les 3 : `GET /`, `GET /health`, `POST /api/decompose`

### 3. Avant de toucher aux handles React Flow
- Les handles sont positionnés par React Flow avec `position: absolute` + `top`/`left`
- Pour changer la taille sans décaler → utiliser `transform: scale()` plutôt que width/height
- Si on change width/height quand même → forcer `translate: -50% -50%` + `top: 0/100%` + `left: 50%`
- `connectOnClick={true}` + `ConnectionMode.Loose` = on clique source puis target, pas de drag
- **Ne pas confondre "inverser la direction de connexion" et "swapper les types source/target"** → toujours clarifier avec l'utilisateur avant un changement structurel

### 4. Comprendre l'intention avant d'agir
- **Si la demande est ambiguë sur le QUOI** (pas le comment) → demander une clarification
- Exemples d'erreurs passées :
  - "Inverse les handles" → j'ai swappé source/target au lieu de changer juste le flow de création
  - Résultat : un revert inutile + du temps perdu
- **Règle** : si un changement est destructif ou structurel (swap de types, refacto d'architecture), confirmer l'intention

### 5. Avant de git add
- **Vérifier le `.gitignore`** — `*.png` est ignoré dans ce projet
- Pour les images dans `frontend/public/`, utiliser `git add -f`
- Ne jamais commit le binaire `caddy` (50MB)
- Ne jamais commit `.env`, `credentials.json`

### 6. Après chaque modification
1. `vite build` → doit passer sans erreur
2. Vérifier `curl -sk https://flompt.dev/` → HTTP 200
3. Si modif backend → vérifier `curl -sk https://flompt.dev/health`
4. Si modif Caddy → vérifier les 3 endpoints (front, health, API)
5. Ne jamais dire "c'est fait" sans avoir vérifié

### 7. Mobile-first mindset
- Toujours penser aux interactions tactiles : pas de hover sur mobile
- Les zones de tap doivent être ≥ 44px (recommandation Apple)
- Utiliser `selected` ou `onTouchStart` au lieu de `:hover` pour les interactions mobile
- Le viewport est verrouillé (`user-scalable=no`) — seul le canvas React Flow zoom
- Tester les changements avec la perspective mobile en tête

### 8. Ne pas itérer inutilement
- **Anticiper les effets de bord** d'un changement CSS/layout AVANT de build
- Un changement de taille implique : centrage, z-index, offsets, responsive, cascade
- **Faire le changement complet en une fois** plutôt que 3-4 allers-retours
- Si plusieurs propriétés sont liées (width + top + translate), les modifier ensemble

---

## SEO / Branding
- **Tagline** : "flow + prompt = flompt"
- **Langue SEO** : anglais (html lang="en", OG locale en_US)
- **Title** : "flompt — Turn Any Prompt into a Visual Flow | AI Prompt Builder"
- **Accent** : #FF3570 (hot pink)
- **Theme** : Mermaid-inspired dark (#1c1c1e)

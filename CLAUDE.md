# CLAUDE.md — flompt

## Règles pour Noryk

### Après chaque mise à jour
À la fin de chaque message contenant une modification du projet, **vérifier et s'assurer** que tout est déployé :

1. Vérifier que le frontend Vite tourne → `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173`
2. Vérifier que le backend FastAPI tourne → `curl -s -o /dev/null -w "%{http_code}" http://localhost:8000`
3. Vérifier que le tunnel serveo répond → `curl -s -o /dev/null -w "%{http_code}" https://[url]`
4. Si l'un des trois est down → le relancer avant d'envoyer le lien
5. Envoyer le lien **uniquement** une fois les 3 vérifications OK

🌐 **https://[url-serveo-active]**

Ne jamais envoyer le lien sans avoir confirmé qu'il répond (HTTP 200).

### Stack
- **Frontend** : React 18 + TypeScript + React Flow v11 + Zustand + Vite (port 5173)
- **Backend** : FastAPI + Uvicorn (port 8000)
- **Tunnel** : serveo.net via SSH → port 5173

### Commandes utiles
```bash
# Frontend
cd /projects/flompt/frontend && node_modules/.bin/vite

# Backend
cd /projects/flompt/backend && .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Tunnel
ssh -o StrictHostKeyChecking=no -R 80:localhost:5173 serveo.net

# Git
cd /projects/flompt && git add ... && git commit && git push origin master
```

### Infos projet
- Repo : https://github.com/Nyrok/flompt
- Git email : nyrokgaming1@gmail.com

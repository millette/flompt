# CLAUDE.md — flompt

## Règles pour Noryk

### Après chaque mise à jour
Toujours rappeler le lien du projet déployé à la fin du message :
🌐 **https://[url-serveo-active]**

Le lien change à chaque redémarrage du tunnel serveo — toujours vérifier qu'il est actif avant de l'envoyer.

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

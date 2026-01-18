# Zoe

Face publique du panthéon.

## Architecture

```
[SHIVA:8080]  ← Claude décide qui entre
     │
[ZOE:8888]    ← Interface web
     │
[ATLAS:9001]  ← Coordinateur
     │
[PHI:9100+]   ← Workers (Claude, search, compute)
     │
[COSMOS:9000] ← Mémoire persistante
```

## Lancement

```bash
./start.sh    # Lance tout
./stop.sh     # Arrête tout
./expose.sh   # Expose au monde (Caddy + HTTPS)
```

## Daemons

| Daemon | Port | Rôle |
|--------|------|------|
| Shiva | 8080 | Gardien - Claude décide l'accès |
| Zoe | 8888 | Interface web publique |
| Atlas | 9001 | Routeur de tâches |
| Phi | 9100-9102 | Workers d'exécution |
| Cosmos | 9000 | Stockage clé-valeur + messages |

## Endpoints

### Zoe (Interface)
- `GET /` - Page d'accueil
- `GET /chat.html` - Chat avec Claude
- `WS /ws` - WebSocket temps réel

### Cosmos (Stockage)
- `POST /memory/set` - Stocker une valeur
- `GET /memory/get/{key}` - Récupérer
- `POST /msg/send` - Envoyer un message
- `GET /msg/recv/{target}` - Recevoir messages

### Atlas (Coordinateur)
- `POST /task/submit` - Soumettre une tâche
- `GET /workers` - Liste des workers
- `WS /ws/{daemon}` - Hub WebSocket

### Phi (Workers)
- `POST /execute` - Exécuter une tâche
- Types: `code`, `search`, `compute`, `hash`, `fetch`

## Prérequis

- Python 3.10+
- FastAPI, httpx, uvicorn, websockets
- Claude CLI (`claude`)

```bash
pip install fastapi httpx uvicorn websockets
```

## Licence

MIT

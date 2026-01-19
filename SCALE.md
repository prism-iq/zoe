# ZOE - Architecture Scalable

## Principe

```
Users (millions)
      |
      v
[GitHub Pages / Cloudflare CDN]
      |
      v
[Edge Workers] ← distribués worldwide
      |
      v
[Backend LLM] ← queue + rate limit
```

## Couches

### 1. Frontend (statique)
- **GitHub Pages** - gratuit, CDN mondial
- **Cloudflare Pages** - alternative, plus rapide
- Tout le JS/CSS/HTML servi depuis le edge
- **Capacité**: illimitée

### 2. API Edge (Cloudflare Workers)
- Code JS qui tourne au plus proche de l'user
- 0ms cold start
- Rate limiting par user
- Queue pour les requêtes LLM
- **Capacité**: 100k req/s

### 3. Backend LLM
- **Option A**: Claude API direct (scalable, payant)
- **Option B**: Self-hosted Ollama (limité, gratuit)
- **Option C**: Hybrid - Ollama local + Claude fallback

## Rate Limiting

```javascript
// Par user
const LIMITS = {
    free: 10,      // msg/heure
    registered: 50,
    premium: 500
};
```

## Queue System

```
User msg → Edge Worker → Redis Queue → LLM Worker → Response
                ↓
          Cache (si déjà répondu)
```

## Déploiement

### Phase 1: GitHub Pages (maintenant)
```bash
# Push to main = deploy
git push origin main
# Site live: https://prism-iq.github.io/zoe/v2/
```

### Phase 2: Cloudflare Worker
```bash
# wrangler.toml
name = "zoe-api"
main = "worker.js"
compatibility_date = "2024-01-01"

[vars]
CLAUDE_API_KEY = "sk-..."
```

### Phase 3: Redis + Queue
- Upstash Redis (serverless)
- Workers KV pour cache

## Coûts estimés

| Users/mois | Frontend | API | LLM | Total |
|------------|----------|-----|-----|-------|
| 1k | $0 | $0 | ~$5 | $5 |
| 10k | $0 | $0 | ~$50 | $50 |
| 100k | $0 | $5 | ~$500 | $505 |
| 1M | $20 | $50 | ~$5000 | $5070 |

## Mode Offline

Si backend down:
- Patterns locaux (js/patterns.js)
- Pas d'IA, mais chat fonctionne
- Expérience dégradée mais jamais cassée

## Iron Code

- Jamais de données personnelles stockées
- User ID = hash anonyme
- Conversations = côté client uniquement
- Backend = stateless

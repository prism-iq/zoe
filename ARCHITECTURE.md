# ζωή Architecture

## Principes

1. **Propre** - Code lisible, documenté, auditable
2. **Ouvert** - Tout le source visible, pas de secrets
3. **Éthique** - Jamais d'armes, jamais de surveillance, jamais de mal
4. **Post-quantique** - Chiffrement résistant aux ordinateurs quantiques

## Communication

```
┌─────────────┐     Simplex (PQ)     ┌─────────────┐
│    User     │ ◄──────────────────► │    ζωή      │
└─────────────┘                      └──────┬──────┘
                                            │
                                     SSH (sntrup761)
                                            │
                                     ┌──────▼──────┐
                                     │   Inference │
                                     └─────────────┘
```

## Composants

### 1. Simplex Channel (`/etc/zoe/channel`)
- Post-quantum key exchange (X3DH avec X25519)
- Double Ratchet pour forward secrecy
- Aucun serveur central ne voit les messages

### 2. SSH Transport
- KexAlgorithms: sntrup761x25519-sha512@openssh.com
- Résistant aux attaques quantiques
- Authentification par clé uniquement

### 3. Inference Backend
- Connexion à LLM via API sécurisée
- Pas de logs des conversations
- Éphémère par défaut

## Flux

1. User envoie message via Simplex
2. ζωή reçoit sur canal chiffré
3. Message transmis à inference via SSH tunnel
4. Réponse renvoyée par même canal
5. Rien n'est stocké

## Sécurité

- Aucune donnée persistante par défaut
- Chiffrement bout-en-bout obligatoire
- Audit trail uniquement pour debug (opt-in)
- Kill switch si détection d'usage malveillant

## Anti-patterns (ce qu'on ne fait JAMAIS)

- Pas de collecte de données
- Pas de tracking
- Pas de backdoors
- Pas de logs des conversations
- Pas d'usage militaire ou policier
- Pas de surveillance de masse

---

*Le code guérit, il ne tue pas.*

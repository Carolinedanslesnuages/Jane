# Jane : API

API NestJS (TypeScript) avec Prisma et PostgreSQL. Documentation interactive : `http://localhost:3300/docs`.

## Commandes

```bash
npm install
npm run start:dev      # serveur avec rechargement
npm run build          # compilation vers dist/
npm test               # tests (PostgreSQL requis, schéma « test » dédié)
npm run db:migrate     # crée et applique une migration en développement
npm run db:deploy      # applique les migrations existantes (production)
npm run db:studio      # explorateur de base de données
```

## Variables d'environnement

Lues depuis `.env` (à la racine du dépôt) ou l'environnement.

| Variable | Rôle | Défaut |
|---|---|---|
| `DATABASE_URL` | connexion PostgreSQL | obligatoire |
| `KEYCLOAK_URL` | adresse publique de Keycloak | obligatoire |
| `KEYCLOAK_REALM` | realm Keycloak | obligatoire |
| `KEYCLOAK_API_CLIENT_ID` | audience attendue dans les jetons | `jane-api` |
| `API_PORT` | port d'écoute | `3300` |
| `WEB_ORIGIN` | origine autorisée par CORS (l'interface) | `http://localhost:5273` |

## Organisation

| Dossier | Contenu |
|---|---|
| `src/auth` | vérification des jetons Keycloak, garde globale, `@Public()`, `@CurrentUser()` |
| `src/animals` | animaux suivis (propriétaire, espèce) |
| `src/ethogram` | comportements par espèce |
| `src/observations` | événements, états chronométrés, liste |
| `src/cognitive-tests` | épreuves chronométrées |
| `src/stats` | budget-temps, stress, chronologie |
| `src/exports` | CSV et rapport PDF |
| `prisma/` | schéma et migrations |
| `test/` | outils de test : schéma dédié, application complète avec un faux vérificateur de jeton |

Toutes les routes exigent un jeton, sauf `/health` et `/ethogram`. Un utilisateur ne voit que ses propres animaux : toute
requête passe par le propriétaire.

## Tests

Les tests `*.spec.ts` couvrent les calculs, les services contre une vraie base et les routes HTTP de bout en bout. Avant la
première exécution, PostgreSQL doit tourner (`docker compose up -d postgres` à la racine) ; les migrations sont appliquées
automatiquement au schéma `test`.

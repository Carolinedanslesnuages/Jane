# Jane 🐕

Carnet d'observation du comportement canin, en application web.

> Jane est nommée en hommage à Jane Goodall, pionnière de l'observation patiente du comportement animal.

Jane permet d'enregistrer des comportements au fil de l'eau (événements instantanés ou états chronométrés), de suivre le
stress, de passer des tests cognitifs, d'analyser le tout dans un tableau de bord et d'exporter les données (CSV, rapport PDF).
Chaque compte ne voit que ses propres chiens.

## Architecture

| Élément | Technologie | Dossier |
|---|---|---|
| Interface | Vue 3, Vite, Pinia, Vue Router, Chart.js | [frontend/](frontend/) |
| API | NestJS 11, Prisma, class-validator, pdfkit | [backend/](backend/) |
| Base de données | PostgreSQL 17 | `docker-compose.yml` |
| Authentification | Keycloak 26 (OpenID Connect, code d'autorisation avec PKCE) | [keycloak/](keycloak/) |
| Déploiement | Docker, Caddy (HTTPS automatique) | [deploy/](deploy/), `docker-compose.prod.yml` |

Le navigateur se connecte à Keycloak, reçoit un jeton d'accès, puis appelle l'API avec ce jeton. L'API vérifie la signature,
l'émetteur et l'audience du jeton (`jane-api`) et rattache chaque compte Keycloak à un utilisateur local.

## Démarrer en local

Prérequis : Node.js 22 ou plus, Docker.

```bash
cp .env.example .env
docker compose up -d            # PostgreSQL (5433) et Keycloak (8180)

cd backend
npm install
npm run db:migrate              # crée les tables
npm run start:dev               # API sur http://localhost:3300 (documentation : /docs)

cd ../frontend
npm install
npm run dev                     # interface sur http://localhost:5273
```

Au premier lancement de Keycloak, le realm `jane` est importé avec un compte de démonstration :
`demo@jane.test` / `demo-jane` (à réserver au développement). L'inscription de nouveaux comptes est ouverte.

Les ports (3300, 5273, 8180, 5433) sont choisis pour ne pas entrer en conflit avec d'autres projets locaux.

## Tests

```bash
cd backend && npm test          # nécessite PostgreSQL (schéma « test » dédié)
cd frontend && npm test
```

Le backend est testé de bout en bout (HTTP, validation, isolation entre utilisateurs, exports) contre une vraie base.
La garde d'authentification est testée avec de vraies clés RSA générées à la volée.

## Mise en ligne

Voir [deploy/README.md](deploy/README.md).

## Ancienne version

La première version, en Streamlit, est conservée dans [legacy/streamlit/](legacy/streamlit/). Elle n'est plus développée.

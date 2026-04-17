# Jane 🐕

Carnet d'observation du comportement animal, en application web.

> Jane est nommée en hommage à Jane Goodall, pionnière de l'observation patiente du comportement animal.

Jane suit des chiens, des chats, des chevaux et d'autres espèces, chacune avec son éthogramme. Elle permet d'enregistrer des
comportements au fil de l'eau (événements instantanés ou états chronométrés), de suivre le stress, de passer des tests
cognitifs, d'analyser le tout dans un tableau de bord et d'exporter les données (CSV, rapport PDF).

## Ce que Jane sait faire

- **Observer** : un éthogramme par espèce, en six catégories (exploration, jeu, repos, social, stress, élimination), avec la
  définition observable de chaque comportement. Saisie en direct ou après coup, états chronométrés, échantillonnage par intervalle.
- **Organiser des séances** : un observateur, une méthode (libre, focal, scan), un début et une fin ; les observations s'y
  rattachent d'elles-mêmes d'après leur heure.
- **Travailler sur le terrain, sans réseau** : l'application s'installe, s'ouvre sans réseau et garde les saisies sur l'appareil
  jusqu'au retour du réseau, avec leur vraie heure.
- **Partager un animal** entre plusieurs comptes (équipe, refuge) : « observateur » saisit, « lecteur » consulte ; chaque
  observation garde le nom de son auteur.
- **Analyser** : budget-temps, évolution du stress et son contexte (heure, lieu, stimulus), activité quotidienne, tests cognitifs.
- **Exporter** : CSV pour R ou un tableur, rapport PDF d'un animal.
- **Protéger les données** : chaque personne ne voit que ses animaux et ceux qu'on a partagés avec elle ; elle peut exporter ou
  supprimer son compte et toutes ses données.

Le guide de prise en main est dans [docs/guide-observateur.md](docs/guide-observateur.md).

## Espèces

Les six catégories de comportements sont communes ; les comportements qu'elles contiennent dépendent de l'espèce : chien,
chat, cheval, et un modèle générique pour les autres. Pour en ajouter une, voir
[docs/ajouter-une-espece.md](docs/ajouter-une-espece.md).

## Architecture

| Élément | Technologie | Dossier |
|---|---|---|
| Interface | Vue 3, Vite, Pinia, Vue Router, Chart.js, application installable (service worker) | [frontend/](frontend/) |
| API | NestJS 11, Prisma, class-validator, pdfkit | [backend/](backend/) |
| Base de données | PostgreSQL 17 | `docker-compose.yml` |
| Authentification | Keycloak 26 (OpenID Connect, code d'autorisation avec PKCE), thème aux couleurs de Jane | [keycloak/](keycloak/) |
| Tests de bout en bout | Playwright (Chrome), axe-core pour l'accessibilité | [e2e/](e2e/) |
| Déploiement | Docker, Caddy (HTTPS automatique), sauvegardes quotidiennes | [deploy/](deploy/), `docker-compose.prod.yml` |

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
cd backend && npm test          # API : calculs, services contre une vraie base, routes HTTP (PostgreSQL requis)
cd frontend && npm test         # interface : stores, composants, hors ligne
cd e2e && npm test              # navigateur réel : connexion Keycloak, parcours complets (la pile doit tourner)
```

Les tests de bout en bout et la version de production (mode hors ligne) sont décrits dans [e2e/README.md](e2e/README.md).

## Mise en ligne

Voir [deploy/README.md](deploy/README.md) (installation, comptes, sauvegardes et restauration, surveillance).

## Ancienne version

La première version, en Streamlit, est conservée dans [legacy/streamlit/](legacy/streamlit/). Elle n'est plus développée.

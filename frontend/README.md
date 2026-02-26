# Jane : interface web

Application Vue 3 (TypeScript, Vite, Pinia, Vue Router, Chart.js). La connexion passe par Keycloak (code d'autorisation avec PKCE).

## Commandes

```bash
npm install
npm run dev            # http://localhost:5273
npm test               # tests (Vitest, jsdom)
npm run typecheck      # vérification des types
npm run build          # production vers dist/
```

## Variables (fichier `.env.development`)

| Variable | Rôle |
|---|---|
| `VITE_API_URL` | adresse de l'API |
| `VITE_KEYCLOAK_URL` | adresse de Keycloak |
| `VITE_KEYCLOAK_REALM` | realm (`jane`) |
| `VITE_KEYCLOAK_CLIENT_ID` | client public (`jane-web`) |

Ces valeurs sont fixées à la construction : en production, elles passent par les arguments de build du `Dockerfile`.

## Organisation

| Dossier | Contenu |
|---|---|
| `src/views` | une page par route |
| `src/components` | composants partagés (cartes, tableau d'observations, bandeau de l'animal…) |
| `src/stores` | états Pinia : animaux, observations, éthogramme par espèce, statistiques, session, notifications |
| `src/composables` | chronomètre, scan sampling, horloge |
| `src/charts` | mise en forme des graphiques |
| `src/styles` | variables de design et styles de base |
| `src/auth`, `src/api` | Keycloak et client HTTP qui joint le jeton |

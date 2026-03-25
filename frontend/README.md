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

### Essayer la version de production (mode hors ligne)

Le service worker qui permet d'ouvrir Jane sans réseau n'existe que dans la version construite :

```bash
npm run build:preview && npm run preview:e2e    # http://localhost:5273 (arrêter `npm run dev` avant)
```

Après une première visite, couper le réseau (outils de développement du navigateur, onglet Réseau) montre le fonctionnement hors ligne.

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

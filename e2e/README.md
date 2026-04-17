# Jane : tests de bout en bout

Ces tests pilotent un vrai Chrome (celui de la machine : rien à télécharger) à travers l'application complète : page de
connexion Keycloak, interface, API et base de données.

## Prérequis

La pile doit tourner, comme pour le développement :

```bash
docker compose up -d                      # PostgreSQL et Keycloak (à la racine)
cd backend && npm run start:dev           # API sur 3300
cd frontend && npm run dev                # interface sur 5273
```

Le compte `demo@jane.test` doit exister (il est créé à l'import du realm). Les tests créent leurs propres animaux sous un
nom unique et les suppriment à la fin ; ceux qui ont besoin d'un deuxième compte l'inscrivent puis le suppriment.

## Lancer

```bash
cd e2e
npm install
npm test                  # tous les parcours
npx playwright test tests/sessions.spec.ts      # un seul fichier
npm run test:headed       # en voyant le navigateur
```

| Fichier | Ce qu'il vérifie |
|---|---|
| `navigation` | connexion Keycloak, toutes les pages, déconnexion |
| `animals` | ajouter, modifier, filtrer, supprimer ; doublons |
| `observation` | éthogramme selon l'espèce, événement, état chronométré, saisie après coup |
| `cognitive` | enregistrer, corriger, supprimer un test |
| `sessions` | séance complète, rattachement des observations |
| `sharing` | partage entre deux comptes : lecteur, observateur, retrait |
| `account` | inscription puis suppression du compte et de ses données |
| `accessibility` | audit axe-core (WCAG 2.1 A et AA) de chaque page |

## Mode hors ligne

Le service worker n'existe que dans la version de production : il faut la servir à la place du serveur de développement.

```bash
cd frontend
npm run build:preview && npm run preview:e2e      # http://localhost:5273 (arrêter « npm run dev » avant)
cd ../e2e
npm run test:offline                              # coupe le réseau, saisit, rouvre, rétablit le réseau
```

## Captures d'écran et icônes

```bash
npm run captures                  # une capture de chaque page dans captures/ (ignoré par git)
node tools/make-icons.mjs         # régénère les icônes de l'application à partir de frontend/public/icon.svg
```

Les tests s'exécutent un à un (une seule base de démonstration). Ils ne sont pas lancés par l'intégration continue, qui n'a
pas de Keycloak.

# Journal des modifications

## 2.1.0 — 26 février 2026

Jane suit désormais tous les animaux, pas seulement les chiens.

### Ajouté
- Une espèce par animal (chien, chat, cheval, autre) et un éthogramme par espèce : les six catégories sont communes, les
  comportements propres à chaque espèce (« Ronronner » pour le chat, « Piaffer » pour le cheval…).
- Le comportement enregistré est vérifié selon l'espèce de l'animal.
- `GET /ethogram?species=` et `GET /animals?species=`.
- Filtre par espèce sur la page Profils, rappel de l'animal suivi en haut des pages, espèce dans l'export CSV et le rapport PDF.
- Guide pour ajouter une espèce (`docs/ajouter-une-espece.md`).
- Contrôle en intégration continue : le schéma Prisma doit avoir sa migration.

### Modifié
- « Chien » devient « animal » partout : modèle, routes (`/animals`), pages et textes. La migration conserve les données ;
  les animaux existants restent des chiens.
- Le dossier de la migration initiale suit l'ordre chronologique des suivantes.

## 2.0.0 — 20 février 2026

Jane devient une application web.

### Ajouté
- API NestJS avec Prisma et PostgreSQL : chiens, événements, états chronométrés, tests cognitifs, statistiques, export CSV
  et rapport PDF, documentation OpenAPI sur `/docs`.
- Authentification par Keycloak (OpenID Connect, PKCE) ; chaque compte ne voit que ses propres données.
- Interface Vue 3 : profils, observation (éthogramme par catégories, états en cours avec chronomètre, scan sampling qui se
  met à jour seul), tests cognitifs chronométrés, tableau de bord (budget-temps, stress, activité), données et exports.
- Déploiement Docker avec Caddy (HTTPS) et guide de mise en ligne.

### Modifié
- L'âge d'un chien est calculé en années et mois calendaires.
- Un état est rattaché au jour où il a commencé, pas à celui où il s'est terminé.
- La suppression d'un chien ou d'une observation demande une confirmation.

### Déplacé
- L'ancienne version Streamlit est conservée dans `legacy/streamlit/` (non développée).

## 1.1.0 — 20 janvier 2026 (Streamlit)

- Nouveau style : palette forêt et sable, titres en serif, cartes, graphiques aux couleurs des catégories.
- Corrections : rapport PDF, migration des anciennes bases, clés étrangères, score facultatif, chronomètre des tests.
- Tests automatisés et intégration continue.

## 1.0.0 — janvier 2026 (Streamlit)

- Première version : éthogramme, modes événement et état, profils, tests cognitifs, tableau de bord, exports.

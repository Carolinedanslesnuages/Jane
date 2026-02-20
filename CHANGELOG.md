# Journal des modifications

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

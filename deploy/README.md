# Mise en ligne de Jane

Jane se déploie avec Docker sur un serveur (par exemple un VPS OVH). Caddy sert l'HTTPS et obtient les certificats seul.

## Avant de commencer

- Un serveur avec Docker et Docker Compose.
- Un nom de domaine, par exemple `jane.example.org`, avec trois enregistrements DNS vers le serveur :
  - `jane.example.org` (l'interface),
  - `api.jane.example.org` (l'API),
  - `auth.jane.example.org` (Keycloak).
- Les ports 80 et 443 ouverts.

## Installation

```bash
git clone <adresse du dépôt> jane && cd jane
cp .env.production.example .env.production
# Éditer .env.production : domaine et mots de passe (PostgreSQL, administrateur Keycloak)
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Les migrations de la base sont appliquées automatiquement au démarrage de l'API.

## Comptes

- Le realm `jane` est importé depuis `keycloak/realm-jane.prod.json`. L'adresse de l'interface y est injectée par la variable
  `JANE_WEB_URL` (déduite du domaine). Aucun compte de démonstration n'est créé.
- La console d'administration Keycloak est sur `https://auth.<domaine>` (compte `admin`, mot de passe de `.env.production`).
  Les visiteurs peuvent créer leur compte depuis la page de connexion ; désactivez « Inscription » dans le realm pour fermer
  l'accès à vous seule.

## Sauvegardes

Tout l'état est dans deux volumes Docker : `postgres_data` (observations, comptes Jane, base de Keycloak) et `caddy_data`
(certificats). Sauvegardez la base régulièrement :

```bash
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U jane jane > jane-$(date +%F).sql
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U jane keycloak > keycloak-$(date +%F).sql
```

## Mise à jour

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

## Ce qui n'a pas été vérifié

Les images de l'API et de l'interface se construisent et l'API démarre (migrations comprises) en conteneur. La configuration de
production complète (domaine réel, HTTPS Caddy, Keycloak derrière le proxy) est écrite d'après la documentation de chaque outil
mais n'a pas encore été essayée sur un serveur : prévoyez un premier essai sur un sous-domaine de test.

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

Le service `backup` sauvegarde chaque jour les deux bases (celle de Jane et celle de Keycloak) dans le volume Docker
`backups`, et garde 14 jours (`BACKUP_KEEP_DAYS`). Chaque sauvegarde est un dossier daté contenant `jane.dump` et `keycloak.dump`.
Une sauvegarde interrompue n'est jamais confondue avec une bonne : le fichier ne prend son nom qu'une fois terminé.

**Une sauvegarde sur le même serveur ne protège pas d'une panne du serveur.** Copiez régulièrement le dossier ailleurs
(autre machine, stockage d'objets) :

```bash
docker compose -f docker-compose.prod.yml cp backup:/backups ./sauvegardes-jane
```

Sauvegarde immédiate (avant une mise à jour, par exemple) :

```bash
docker compose -f docker-compose.prod.yml exec backup sh /backup.sh
```

### Restaurer

Choisissez un dossier daté, puis restaurez la base voulue. **La base cible est supprimée puis recréée.**

```bash
docker compose -f docker-compose.prod.yml stop api keycloak
docker compose -f docker-compose.prod.yml cp deploy/restore.sh backup:/restore.sh
docker compose -f docker-compose.prod.yml exec -e PGDATABASE=postgres backup \
  sh /restore.sh /backups/2026-04-12_030000/jane.dump jane
docker compose -f docker-compose.prod.yml start api keycloak
```

Essayez la restauration une fois à blanc (vers une base de test, par exemple `jane_essai`) avant d'en avoir besoin.

## Surveillance

- `GET /health` répond 200 si l'API joint sa base, 503 sinon ; `GET /health/live` répond tant que le processus tourne. Docker
  s'en sert pour marquer le conteneur de l'API « healthy » ou « unhealthy » (`docker compose ps`).
- Les journaux de l'API (`docker compose logs api`) comptent une ligne JSON par requête (méthode, chemin, statut, durée, compte).
  Les paramètres de l'adresse et le contenu des requêtes n'y figurent pas.
- L'API limite le nombre de requêtes par adresse (300 par minute, 20 pour les exports) et répond 429 au-delà.

## Mise à jour

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

## Ce qui n'a pas été vérifié

Les images de l'API et de l'interface se construisent et l'API démarre (migrations comprises) en conteneur. La configuration de
production complète (domaine réel, HTTPS Caddy, Keycloak derrière le proxy) est écrite d'après la documentation de chaque outil
mais n'a pas encore été essayée sur un serveur : prévoyez un premier essai sur un sous-domaine de test.

#!/bin/sh
# Sauvegarde les bases PostgreSQL de Jane (données de l'application et comptes Keycloak) dans un dossier daté,
# puis supprime les sauvegardes de plus de BACKUP_KEEP_DAYS jours (14 par défaut).
#
# Utilisation : sh backup.sh                       (une sauvegarde, tout de suite)
#               sh backup.sh --loop                (une sauvegarde par jour, sans fin : service « backup » du compose)
# Variables : PGHOST, PGUSER, PGPASSWORD, BACKUP_DIR, BACKUP_KEEP_DAYS, BACKUP_DATABASES
set -eu

BACKUP_DIR="${BACKUP_DIR:-/backups}"
BACKUP_KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
BACKUP_DATABASES="${BACKUP_DATABASES:-jane keycloak}"

backup_once() {
  stamp="$(date +%Y-%m-%d_%H%M%S)"
  target="$BACKUP_DIR/$stamp"
  mkdir -p "$target"
  for database in $BACKUP_DATABASES; do
    # Écrit dans un fichier temporaire : une sauvegarde interrompue n'est jamais prise pour une bonne.
    pg_dump --format=custom --dbname="$database" --file="$target/$database.dump.partial"
    mv "$target/$database.dump.partial" "$target/$database.dump"
  done
  echo "Sauvegarde terminée : $target"
  find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -mtime "+$BACKUP_KEEP_DAYS" -exec rm -rf {} +
}

if [ "${1:-}" = "--loop" ]; then
  while true; do
    backup_once || echo "Sauvegarde en échec" >&2
    sleep 86400
  done
else
  backup_once
fi

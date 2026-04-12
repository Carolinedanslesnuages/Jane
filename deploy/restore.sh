#!/bin/sh
# Restaure une base à partir d'une sauvegarde faite par backup.sh.
# Utilisation : sh restore.sh /backups/2026-04-12_030000/jane.dump jane
# La base cible est SUPPRIMÉE puis recréée : à n'utiliser que pour revenir en arrière.
set -eu

if [ "$#" -ne 2 ]; then
  echo "Utilisation : sh restore.sh <fichier.dump> <base>" >&2
  exit 2
fi
dump="$1"
database="$2"

[ -f "$dump" ] || { echo "Fichier introuvable : $dump" >&2; exit 1; }
dropdb --if-exists "$database"
createdb "$database"
pg_restore --no-owner --dbname="$database" "$dump"
echo "Base $database restaurée depuis $dump"

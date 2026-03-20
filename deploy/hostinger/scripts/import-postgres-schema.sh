#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="/var/www/temnaarea/api"
SCHEMA_FILE="$APP_ROOT/backend/database/tem_na_area_postgres.sql"

if [ ! -f "$SCHEMA_FILE" ]; then
  echo "Schema nao encontrado em $SCHEMA_FILE"
  exit 1
fi

sudo -u postgres psql -d tem_na_area -f "$SCHEMA_FILE"

echo "Schema PostgreSQL importado com sucesso."

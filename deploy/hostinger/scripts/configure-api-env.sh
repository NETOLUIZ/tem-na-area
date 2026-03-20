#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="/var/www/temnaarea/api"
ENV_TARGET="$APP_ROOT/backend/node/.env"
ENV_TEMPLATE="$APP_ROOT/backend/node/.env.hostinger.postgres.example"

if [ ! -f "$ENV_TEMPLATE" ]; then
  echo "Template nao encontrado em $ENV_TEMPLATE"
  exit 1
fi

cp "$ENV_TEMPLATE" "$ENV_TARGET"
chmod 600 "$ENV_TARGET"

echo "Arquivo .env criado em $ENV_TARGET. Edite a DATABASE_URL e a chave JWT antes de subir a API."

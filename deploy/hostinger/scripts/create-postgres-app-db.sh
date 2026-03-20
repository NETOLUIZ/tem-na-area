#!/usr/bin/env bash
set -euo pipefail

if [ "${#}" -lt 1 ]; then
  echo "Uso: bash create-postgres-app-db.sh '<senha_forte_do_usuario_temnaarea_app>'"
  exit 1
fi

APP_DB_PASSWORD="$1"

sudo -u postgres psql <<SQL
DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'temnaarea_app') THEN
      CREATE ROLE temnaarea_app LOGIN PASSWORD '${APP_DB_PASSWORD}';
   ELSE
      ALTER ROLE temnaarea_app WITH LOGIN PASSWORD '${APP_DB_PASSWORD}';
   END IF;
END
\$\$;
SQL

DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname = 'tem_na_area'")
if [ "$DB_EXISTS" != "1" ]; then
  sudo -u postgres createdb -O temnaarea_app tem_na_area
fi

sudo -u postgres psql -d tem_na_area <<SQL
ALTER DATABASE tem_na_area OWNER TO temnaarea_app;
GRANT ALL PRIVILEGES ON DATABASE tem_na_area TO temnaarea_app;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
SQL

echo "Banco tem_na_area e usuario temnaarea_app prontos."

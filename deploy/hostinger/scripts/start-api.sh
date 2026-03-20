#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="/var/www/temnaarea/api"
API_ROOT="$APP_ROOT/backend/node"

cd "$APP_ROOT"
npm ci
cd "$API_ROOT"
npm ci
pm2 start /var/www/temnaarea/api/deploy/hostinger/pm2/ecosystem.config.cjs --only temnaarea-api
pm2 save

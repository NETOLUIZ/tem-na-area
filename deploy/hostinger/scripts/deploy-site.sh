#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="/var/www/temnaarea/api"
SITE_ROOT="/var/www/temnaarea/site"

cd "$APP_ROOT/frontend"
cp .env.site.example .env.production.local
npm ci
npm run build

sudo mkdir -p "$SITE_ROOT"
sudo rsync -av --delete dist/ "$SITE_ROOT/"

#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="/var/www/temnaarea/api"
PDV_ROOT="/var/www/temnaarea/pdv"

cd "$APP_ROOT/frontend"
cp .env.pdv.example .env.production.local
npm ci
npm run build

sudo mkdir -p "$PDV_ROOT"
sudo rsync -av --delete dist/ "$PDV_ROOT/"

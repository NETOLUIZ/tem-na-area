#!/usr/bin/env bash
set -euo pipefail

sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx git curl rsync
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

sudo mkdir -p /var/www/temnaarea/site
sudo mkdir -p /var/www/temnaarea/pdv
sudo mkdir -p /var/www/temnaarea/api
sudo mkdir -p /var/log/temnaarea

sudo chown -R "$USER":"$USER" /var/www/temnaarea
sudo chown -R "$USER":"$USER" /var/log/temnaarea

#!/usr/bin/env bash
set -euo pipefail

sudo -u postgres psql -d tem_na_area -c "\dt"
sudo -u postgres psql -d tem_na_area -c "SELECT NOW() AS database_time;"
sudo -u postgres psql -d tem_na_area -c "SELECT id, nome, slug, status_loja FROM lojas ORDER BY id;"

FROM mysql:8.0

# Inicializa o banco com schema, seed e tabelas extras na primeira subida do disco.
COPY backend/database/tem_na_area_mysql.sql /docker-entrypoint-initdb.d/01-tem-na-area-schema.sql
COPY backend/database/tem_na_area_seed.sql /docker-entrypoint-initdb.d/02-tem-na-area-seed.sql
COPY backend/database/tem_na_area_addons.sql /docker-entrypoint-initdb.d/03-tem-na-area-addons.sql

# Deploy no Render

Arquivos usados no deploy:

- `../../render.yaml`: blueprint com Postgres gratis, API Node e frontend.
- `../../backend/database/tem_na_area_postgres.sql`: schema inicial usado no bootstrap da API.

## Observacoes

- A API sobe e garante o schema minimo no primeiro start.
- O blueprint atual foi ajustado para caber no plano gratis usando Postgres gerenciado do Render.

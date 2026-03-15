# Deploy no Render

Arquivos usados no deploy:

- `../../render.yaml`: blueprint da API Node no Render.
- `../../backend/database/tem_na_area_postgres.sql`: schema inicial para importar no Supabase.

## Observacoes

- Defina `DATABASE_URL` manualmente no Render com a string do Supabase.
- Defina `CORS_ORIGIN` com a URL do frontend no Vercel.
- O banco agora fica fora do Render.

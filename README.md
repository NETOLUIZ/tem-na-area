# Hub Local

Projeto separado em duas partes:

- `frontend/`: aplicacao React com Vite.
- `backend/`: API Node.js e scripts SQL do banco.

## Estrutura

```txt
hublocal/
  frontend/
    src/
    public/
    package.json
    vite.config.js
  backend/
    node/
    database/
```

## Como rodar

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Backend:

```powershell
cd backend/node
npm install
npm run dev
```

O frontend usa por padrao a API em `http://127.0.0.1:3001/api/v1`.

## Deploy no Render

O repositorio ja inclui [render.yaml](c:/Users/acer/Documents/hublocal/render.yaml) para subir:

- a API Node no Render
- o frontend no Vercel
- o banco no Supabase

Arquivos de apoio:

- [render.yaml](c:/Users/acer/Documents/hublocal/render.yaml)
- [backend/database/tem_na_area_postgres.sql](c:/Users/acer/Documents/hublocal/backend/database/tem_na_area_postgres.sql)
- [frontend/vercel.json](c:/Users/acer/Documents/hublocal/frontend/vercel.json)

API no Render:

1. Conecte este repositorio em `Blueprints`.
2. Crie apenas o servico `tem-na-area-api-netoluiz`.
3. Preencha manualmente `DATABASE_URL` com a conexao do Supabase.
4. Preencha `CORS_ORIGIN` com a URL do frontend no Vercel.
5. Valide a API em `/api/v1/health`.

Frontend no Vercel:

1. Importe a pasta `frontend/`.
2. Configure `VITE_API_BASE_URL` com a URL da API do Render seguida de `/api/v1`.

## Variaveis de ambiente

- `frontend/.env.example`
- `backend/node/.env.example`

## Banco

Para Postgres, use:

```txt
backend/database/tem_na_area_postgres.sql
```

Importe esse arquivo no SQL Editor do Supabase antes de subir a API.

## Workflows

Em `.github/workflows`:

- `ci.yml`: build do frontend e validacao do backend Node
- `frontend-pages.yml`: deploy opcional do frontend estatico via GitHub Pages

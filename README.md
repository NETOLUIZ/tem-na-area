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

## Deploy

Opcao 1:

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

Opcao 2:

- frontend e API no Netlify
- banco no Supabase

Arquivos:

- [netlify.toml](c:/Users/acer/Documents/hublocal/netlify.toml)
- [netlify/functions/api.mjs](c:/Users/acer/Documents/hublocal/netlify/functions/api.mjs)

No Netlify:

1. Importe o repositorio.
2. Use o arquivo `netlify.toml` da raiz.
3. Defina `DATABASE_URL` com a conexao do Supabase.
4. Defina `TEM_NA_AREA_APP_ENV=production`.
5. Defina `TEM_NA_AREA_APP_KEY` com uma chave longa.
6. Defina `CORS_ORIGIN=*`.
7. Defina `VITE_API_BASE_URL=/api/api/v1`.

## Hostinger

Se voce for subir a API Node na Hostinger via SSH, rode os comandos na raiz do repositorio clonado, onde existe o arquivo `package.json`.

Exemplo:

```bash
cd /var/www/tem-na-area-api
git pull origin main
npm install
npm start
```

Se voce quiser rodar apenas a API manualmente pela subpasta do backend, use:

```bash
cd /var/www/tem-na-area-api/backend/node
npm install
npm start
```

O erro `ENOENT: no such file or directory, open '/var/www/tem-na-area-api/package.json'` significa que uma destas condicoes aconteceu:

- o repositorio nao foi clonado nessa pasta
- os arquivos foram enviados para outra pasta
- voce executou `npm` antes de entrar na pasta correta

Para confirmar no servidor:

```bash
cd /var/www/tem-na-area-api
ls -la
```

Voce precisa ver pelo menos:

- `package.json`
- `frontend/`
- `backend/`

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

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

- um Postgres gratis do Render
- a API Node
- o frontend estatico

Arquivos de apoio:

- [render.yaml](c:/Users/acer/Documents/hublocal/render.yaml)
- [backend/database/tem_na_area_postgres.sql](c:/Users/acer/Documents/hublocal/backend/database/tem_na_area_postgres.sql)

No Render:

1. Conecte este repositorio em `Blueprints`.
2. Revise os nomes dos servicos e confirme a criacao.
3. Aguarde o Postgres e a API terminarem o bootstrap.
4. Valide a API em `/api/v1/health`.

O setup atual usa `Render Postgres` no plano gratis. O frontend recebe o hostname externo da API pelo proprio Blueprint e monta `https://.../api/v1` no build.

## Variaveis de ambiente

- `frontend/.env.example`
- `backend/node/.env.example`

## Banco

Para Postgres, use:

```txt
backend/database/tem_na_area_postgres.sql
```

Os arquivos MySQL antigos podem continuar como referencia, mas o backend Node e o deploy atual usam Postgres.

## Workflows

Em `.github/workflows`:

- `ci.yml`: build do frontend e validacao do backend Node
- `frontend-pages.yml`: deploy opcional do frontend estatico via GitHub Pages

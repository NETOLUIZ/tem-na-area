# Hub Local

Projeto separado em duas partes:

- `frontend/`: aplicacao React com Vite.
- `backend/`: API Node.js e scripts SQL do MySQL.

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

## Variaveis de ambiente

- `frontend/.env.example`
- `backend/node/.env.example`

## Banco

Importe o schema principal e depois aplique a migracao complementar:

```txt
backend/database/tem_na_area_mysql.sql
backend/database/tem_na_area_seed.sql
backend/database/tem_na_area_addons.sql
```

O arquivo `tem_na_area_addons.sql` adiciona os recursos novos do painel:

- grupos de montagem de produtos
- opcoes de montagem
- vinculos de grupos por produto

## Workflows

Em `.github/workflows`:

- `ci.yml`: build do frontend e validacao do backend Node
- `frontend-pages.yml`: deploy opcional do frontend estatico via GitHub Pages

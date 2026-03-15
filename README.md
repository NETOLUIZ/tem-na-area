# Hub Local

Projeto separado em duas partes:

- `frontend/`: aplicacao React com Vite.
- `backend/`: API PHP e scripts SQL do MySQL.

## Estrutura

```txt
hublocal/
  frontend/
    src/
    public/
    package.json
    vite.config.js
  backend/
    php/
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
cd backend
php -S 127.0.0.1:8000 php/router.php
```

O frontend usa por padrao a API em `http://127.0.0.1:8000/api/v1`.

## Variaveis de ambiente

- `frontend/.env.example`
- `backend/php/.env.example`

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

- `ci.yml`: build do frontend e lint do PHP
- `frontend-pages.yml`: deploy opcional do frontend estatico via GitHub Pages

## Observacao

Os arquivos `project-export.*` e `merchant-admin-export.*` foram mantidos na raiz como material de referencia do projeto.

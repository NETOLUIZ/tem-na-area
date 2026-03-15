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

## Observacao

Os arquivos `project-export.*` e `merchant-admin-export.*` foram mantidos na raiz como material de referencia do projeto.

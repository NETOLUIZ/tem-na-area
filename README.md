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

## Deploy no Render

O repositório já inclui [render.yaml](c:/Users/acer/Documents/hublocal/render.yaml) para subir:

- um MySQL privado com disco persistente
- a API Node
- o frontend estático

Arquivos de apoio:

- [render.yaml](c:/Users/acer/Documents/hublocal/render.yaml)
- [backend/render/mysql/Dockerfile](c:/Users/acer/Documents/hublocal/backend/render/mysql/Dockerfile)

No Render:

1. Conecte este repositório em `Blueprints`.
2. Revise os nomes dos serviços e confirme a criação.
3. Aguarde primeiro o MySQL inicializar com o schema.
4. Depois valide a API em `/api/v1/health`.

O setup usa MySQL em `private service` com disco persistente, conforme a documentação oficial do Render.
O frontend recebe o hostname externo da API pelo próprio Blueprint e monta `https://.../api/v1` no build.

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

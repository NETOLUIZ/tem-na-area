# Tem na Area na Hostinger

## 1. Arquitetura

- `https://temnaarea.site` e `https://www.temnaarea.site`: frontend principal React/Vite.
- `https://pdv.temnaarea.site`: frontend do PDV React/Vite.
- `https://api.temnaarea.site`: API Node.js + Express central.
- Banco de dados unico compartilhado pelos dois frontends.
- Todo trafego entre frontends e banco passa pela API central.

Fluxo principal:

1. Cliente cria pedido no site.
2. O frontend envia `POST https://api.temnaarea.site/api/v1/orders`.
3. A API grava o pedido no banco.
4. O PDV consulta `GET https://api.temnaarea.site/api/v1/orders`.
5. O atendente altera o status com `PATCH https://api.temnaarea.site/api/v1/orders/:id/status`.
6. O site consulta novamente o pedido pela API e reflete o novo status.

## 2. Estrutura de pastas na VPS

```txt
/var/www/temnaarea/
  site/                    # build do frontend principal
  pdv/                     # build do frontend do PDV
  api/                     # repositorio clonado
    backend/node/          # API Express
    frontend/              # codigo React/Vite
    deploy/hostinger/      # nginx, pm2, scripts
  /var/log/temnaarea/      # logs da API via PM2
```

## 3. Backend central

Arquivos principais:

- `backend/node/src/server.js`
- `backend/node/src/app.js`
- `backend/node/src/config/cors.js`
- `backend/node/src/middleware/auth.js`
- `backend/node/src/middleware/security.js`

Rotas centrais:

- `GET /api/v1/stores`
- `GET /api/v1/products?store_id=1`
- `POST /api/v1/orders`
- `GET /api/v1/orders`
- `PATCH /api/v1/orders/:id/status`
- `GET /api/v1/payments`
- `GET /api/v1/sales`

Autenticacao:

- login admin: `POST /api/v1/auth/admin/login`
- login loja/PDV: `POST /api/v1/auth/merchant/login`
- login PDV alternativo: `POST /api/v1/pdv/auth/login`

JWT:

- header: `Authorization: Bearer <token>`
- middleware usado em rotas privadas: `auth.requireRole("merchant", "admin")`

## 4. CORS

A API aceita apenas:

- `https://temnaarea.site`
- `https://www.temnaarea.site`
- `https://pdv.temnaarea.site`

Arquivo:

- `backend/node/src/config/cors.js`

Variavel:

```env
CORS_ORIGIN=https://temnaarea.site,https://www.temnaarea.site,https://pdv.temnaarea.site
```

## 5. Frontend

Ambientes gerados:

- `frontend/.env.site.example`
- `frontend/.env.pdv.example`

Ambos apontam para:

```env
VITE_API_BASE_URL=https://api.temnaarea.site/api/v1
```

Build do site:

```bash
cd /var/www/temnaarea/api/frontend
cp .env.site.example .env.production.local
npm ci
npm run build
rsync -av --delete dist/ /var/www/temnaarea/site/
```

Build do PDV:

```bash
cd /var/www/temnaarea/api/frontend
cp .env.pdv.example .env.production.local
npm ci
npm run build
rsync -av --delete dist/ /var/www/temnaarea/pdv/
```

## 6. Banco de dados unico

Opcao oficial deste projeto:

- PostgreSQL central na mesma VPS da Hostinger.

Variavel padrao:

```env
DATABASE_URL=postgresql://temnaarea_app:troque-senha@127.0.0.1:5432/tem_na_area
```

Schema:

- `backend/database/tem_na_area_postgres.sql`

Provisionamento na VPS:

```bash
bash /var/www/temnaarea/api/deploy/hostinger/scripts/install-postgres.sh
bash /var/www/temnaarea/api/deploy/hostinger/scripts/create-postgres-app-db.sh 'SENHA_FORTE_AQUI'
bash /var/www/temnaarea/api/deploy/hostinger/scripts/import-postgres-schema.sh
bash /var/www/temnaarea/api/deploy/hostinger/scripts/configure-api-env.sh
```

Template de ambiente da API em producao:

- `backend/node/.env.hostinger.postgres.example`

## 7. NGINX

Arquivos gerados:

- `deploy/hostinger/nginx/temnaarea.site.conf`
- `deploy/hostinger/nginx/pdv.temnaarea.site.conf`
- `deploy/hostinger/nginx/api.temnaarea.site.conf`

Instalacao:

```bash
sudo cp /var/www/temnaarea/api/deploy/hostinger/nginx/temnaarea.site.conf /etc/nginx/sites-available/temnaarea.site.conf
sudo cp /var/www/temnaarea/api/deploy/hostinger/nginx/pdv.temnaarea.site.conf /etc/nginx/sites-available/pdv.temnaarea.site.conf
sudo cp /var/www/temnaarea/api/deploy/hostinger/nginx/api.temnaarea.site.conf /etc/nginx/sites-available/api.temnaarea.site.conf

sudo ln -s /etc/nginx/sites-available/temnaarea.site.conf /etc/nginx/sites-enabled/temnaarea.site.conf
sudo ln -s /etc/nginx/sites-available/pdv.temnaarea.site.conf /etc/nginx/sites-enabled/pdv.temnaarea.site.conf
sudo ln -s /etc/nginx/sites-available/api.temnaarea.site.conf /etc/nginx/sites-enabled/api.temnaarea.site.conf

sudo nginx -t
sudo systemctl reload nginx
```

Os frontends usam `try_files $uri $uri/ /index.html` para suportar refresh de rota do React.

## 8. PM2

Arquivo:

- `deploy/hostinger/pm2/ecosystem.config.cjs`

Comandos:

```bash
cd /var/www/temnaarea/api/backend/node
npm ci
pm2 start /var/www/temnaarea/api/deploy/hostinger/pm2/ecosystem.config.cjs --only temnaarea-api
pm2 save
pm2 startup
```

Logs:

```bash
pm2 logs temnaarea-api
```

## 9. Instalacao inicial da VPS

```bash
bash /var/www/temnaarea/api/deploy/hostinger/scripts/install-vps.sh
```

Depois clone o repositorio:

```bash
cd /var/www/temnaarea
git clone <SEU_REPOSITORIO_GIT> api
```

Provisione o PostgreSQL:

```bash
bash /var/www/temnaarea/api/deploy/hostinger/scripts/install-postgres.sh
bash /var/www/temnaarea/api/deploy/hostinger/scripts/create-postgres-app-db.sh 'SENHA_FORTE_AQUI'
bash /var/www/temnaarea/api/deploy/hostinger/scripts/import-postgres-schema.sh
bash /var/www/temnaarea/api/deploy/hostinger/scripts/configure-api-env.sh
nano /var/www/temnaarea/api/backend/node/.env
```

## 10. Deploy

API:

```bash
bash /var/www/temnaarea/api/deploy/hostinger/scripts/deploy-api.sh
```

Frontend principal:

```bash
bash /var/www/temnaarea/api/deploy/hostinger/scripts/deploy-site.sh
```

PDV:

```bash
bash /var/www/temnaarea/api/deploy/hostinger/scripts/deploy-pdv.sh
```

## 11. SSL

Depois que DNS e NGINX estiverem prontos:

```bash
sudo certbot --nginx -d temnaarea.site -d www.temnaarea.site
sudo certbot --nginx -d pdv.temnaarea.site
sudo certbot --nginx -d api.temnaarea.site
```

Teste de renovacao:

```bash
sudo certbot renew --dry-run
```

## 12. DNS e subdominios

Na Hostinger:

1. Crie os registros `A` para `@`, `www`, `pdv` e `api`.
2. Aponte todos para o IP publico da VPS.
3. Aguarde a propagacao antes de solicitar o SSL.

## 13. Testes finais

API:

```bash
curl https://api.temnaarea.site/api/v1/health
```

Teste do banco local na VPS:

```bash
sudo -u postgres psql -d tem_na_area -c "\dt"
sudo -u postgres psql -d tem_na_area -c "SELECT id, nome, slug FROM lojas ORDER BY id;"
```

Pedido no site:

```bash
curl -X POST https://api.temnaarea.site/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "store_slug": "burger-na-area",
    "cliente_id": 1,
    "nome_cliente": "Maria Souza",
    "telefone_cliente": "11977776666",
    "itens": [
      { "produto_id": 1, "quantidade": 1 }
    ]
  }'
```

Login PDV:

```bash
curl -X POST https://api.temnaarea.site/api/v1/pdv/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "login": "joao@burgernaarea.com", "senha": "123456" }'
```

Listar pedidos no PDV:

```bash
curl https://api.temnaarea.site/api/v1/orders \
  -H "Authorization: Bearer SEU_TOKEN"
```

Atualizar status:

```bash
curl -X PATCH https://api.temnaarea.site/api/v1/orders/1/status \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "status": "EM_PREPARO" }'
```

## 14. Checklist de producao

- DNS de `@`, `www`, `pdv` e `api` apontando para a VPS.
- `nginx -t` sem erro.
- SSL emitido para os 3 blocos de dominio.
- API respondendo em `https://api.temnaarea.site/api/v1/health`.
- PM2 persistido com `pm2 save`.
- `.env` real criado em `backend/node/.env`.
- PostgreSQL instalado, ativo e com o schema importado.
- `DATABASE_URL` apontando para `temnaarea_app@127.0.0.1:5432/tem_na_area`.
- CORS liberando apenas os 3 dominos autorizados.
- Banco acessivel apenas pela API.
- Frontend principal e PDV buildados e copiados para seus diretorios.

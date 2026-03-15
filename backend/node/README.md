# Tem na Area Node API

Backend em Node.js para o projeto `Tem na Area`, mantendo as rotas `/api/v1` usadas pelo frontend e o mesmo banco MySQL.

## Comandos

```powershell
npm install
npm run dev
npm start
```

## Variaveis de ambiente

```env
TEM_NA_AREA_DB_HOST=127.0.0.1
TEM_NA_AREA_DB_PORT=3306
TEM_NA_AREA_DB_NAME=tem_na_area
TEM_NA_AREA_DB_USER=root
TEM_NA_AREA_DB_PASS=
TEM_NA_AREA_APP_ENV=local
TEM_NA_AREA_APP_URL=http://127.0.0.1:3001
TEM_NA_AREA_APP_KEY=troque-esta-chave
TEM_NA_AREA_PORT=3001
CORS_ORIGIN=http://localhost:5173
```

## Rotas

- `GET /api/v1/health`
- `POST /api/v1/auth/merchant/login`
- `POST /api/v1/auth/admin/login`
- `GET /api/v1/public/home`
- `GET /api/v1/public/stores`
- `GET /api/v1/public/stores/:slug`
- `POST /api/v1/public/leads/free`
- `POST /api/v1/public/leads/paid`
- `POST /api/v1/public/orders`
- `GET /api/v1/merchant/dashboard`
- `GET /api/v1/merchant/orders`
- `PATCH /api/v1/merchant/orders/:id/status`
- `GET /api/v1/merchant/products`
- `POST /api/v1/merchant/products`
- `PUT /api/v1/merchant/products/:id`
- `DELETE /api/v1/merchant/products/:id`
- `GET /api/v1/merchant/settings`
- `PUT /api/v1/merchant/settings`
- `GET /api/v1/merchant/option-groups`
- `POST /api/v1/merchant/option-groups`
- `PUT /api/v1/merchant/option-groups/:id`
- `DELETE /api/v1/merchant/option-groups/:id`
- `GET /api/v1/merchant/promotions`
- `POST /api/v1/merchant/promotions`
- `PUT /api/v1/merchant/promotions/:id`
- `DELETE /api/v1/merchant/promotions/:id`
- `GET /api/v1/admin/dashboard`
- `GET /api/v1/admin/stores`
- `PATCH /api/v1/admin/stores/:id/status`
- `GET /api/v1/admin/logs`
- `GET /api/v1/admin/leads`
- `PATCH /api/v1/admin/leads/:id/approve`

## Banco

Importe nesta ordem:

```txt
../database/tem_na_area_mysql.sql
../database/tem_na_area_seed.sql
../database/tem_na_area_addons.sql
```

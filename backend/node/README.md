# Tem na Area Node API

API central em Node.js + Express para o ecossistema `Tem na Area`, com:

- frontend principal em `temnaarea.site`
- frontend PDV em `pdv.temnaarea.site`
- API central em `api.temnaarea.site`
- PostgreSQL unico compartilhado

## Comandos

```powershell
npm install
npm run dev
npm start
```

## Variaveis de ambiente

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/tem_na_area
TEM_NA_AREA_APP_ENV=local
TEM_NA_AREA_SITE_URL=https://temnaarea.site
TEM_NA_AREA_SITE_WWW_URL=https://www.temnaarea.site
TEM_NA_AREA_PDV_URL=https://pdv.temnaarea.site
TEM_NA_AREA_API_URL=https://api.temnaarea.site
TEM_NA_AREA_APP_URL=http://127.0.0.1:3001
TEM_NA_AREA_APP_KEY=troque-esta-chave
TEM_NA_AREA_PORT=3001
CORS_ORIGIN=https://temnaarea.site,https://www.temnaarea.site,https://pdv.temnaarea.site
```

## Rotas

- `GET /api/v1/health`
- `GET /api/v1/health/db`
- `POST /api/v1/auth/merchant/login`
- `POST /api/v1/auth/admin/login`
- `GET /api/v1/stores`
- `GET /api/v1/products`
- `GET /api/v1/orders`
- `POST /api/v1/orders`
- `PATCH /api/v1/orders/:id/status`
- `GET /api/v1/payments`
- `GET /api/v1/sales`
- `POST /api/v1/pdv/auth/login`
- `GET /api/v1/pdv/bootstrap`
- `GET /api/v1/pdv/products`
- `GET /api/v1/pdv/customers`
- `POST /api/v1/pdv/customers`
- `GET /api/v1/pdv/orders`
- `GET /api/v1/pdv/orders/:id`
- `POST /api/v1/pdv/orders`
- `PATCH /api/v1/pdv/orders/:id/status`
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

Schema PostgreSQL oficial:

```txt
../database/tem_na_area_postgres.sql
```

Em producao, use:

- `TEM_NA_AREA_BOOTSTRAP_DB=false`
- importacao explicita do schema antes de subir a API
- `GET /api/v1/health/db` para validar conexao real com o banco

## API do PDV

Fluxo minimo:

1. Fazer login em `POST /api/v1/pdv/auth/login`
2. Salvar o `token`
3. Enviar `Authorization: Bearer <token>` nas rotas seguintes
4. Carregar bootstrap em `GET /api/v1/pdv/bootstrap`

Exemplo de criacao de pedido pelo PDV:

```json
{
  "cliente_id": 1,
  "tipo_entrega": "RETIRADA",
  "status_pagamento": "PENDENTE",
  "desconto": 0,
  "taxa_entrega": 0,
  "observacoes_cliente": "Pedido criado no caixa",
  "itens": [
    {
      "produto_id": 5,
      "quantidade": 1,
      "observacoes": "Sem cebola"
    }
  ]
}
```

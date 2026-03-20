# Tem na Area Node API

Backend em Node.js para o projeto `Tem na Area`, mantendo as rotas `/api/v1` usadas pelo frontend e usando Postgres.

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
TEM_NA_AREA_APP_URL=http://127.0.0.1:3001
TEM_NA_AREA_APP_KEY=troque-esta-chave
TEM_NA_AREA_PORT=3001
CORS_ORIGIN=http://localhost:5173
```

## Rotas

- `GET /api/v1/health`
- `POST /api/v1/auth/merchant/login`
- `POST /api/v1/auth/admin/login`
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

O backend inicializa automaticamente o schema minimo do Postgres usando:

```txt
../database/tem_na_area_postgres.sql
```

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

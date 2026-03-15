# Tem na Area PHP API

Backend organizado em PHP puro para o projeto `Tem na Area`, usando o schema MySQL ja existente em [`database/tem_na_area_mysql.sql`](../database/tem_na_area_mysql.sql).

## Estrutura

- `config/`: configuracao do banco e da aplicacao.
- `src/Http/`: request, response e roteador.
- `src/Support/`: excecoes, token assinado e utilitarios.
- `src/Repositories/`: consultas e persistencia no MySQL.
- `src/Services/`: regras de negocio.
- `src/Controllers/`: endpoints por contexto.
- `public/index.php`: entrypoint unico da API.
- `router.php`: helper para usar com `php -S`.
- `api/*.php`: wrappers legados para compatibilidade.

## Variaveis de ambiente

```env
TEM_NA_AREA_DB_HOST=127.0.0.1
TEM_NA_AREA_DB_PORT=3306
TEM_NA_AREA_DB_NAME=tem_na_area
TEM_NA_AREA_DB_USER=root
TEM_NA_AREA_DB_PASS=
TEM_NA_AREA_APP_ENV=local
TEM_NA_AREA_APP_URL=http://localhost:8000
TEM_NA_AREA_APP_KEY=troque-esta-chave
```

## Como subir localmente

```powershell
php -S 127.0.0.1:8000 php/router.php
```

## Banco

- Estrutura principal: `../database/tem_na_area_mysql.sql`
- Seed inicial: `../database/tem_na_area_seed.sql`
- Recursos extras do painel: `../database/tem_na_area_addons.sql`

## Endpoints principais

### Publico

- `GET /api/v1/health`
- `GET /api/v1/public/home`
- `GET /api/v1/public/stores`
- `GET /api/v1/public/stores/{slug}`
- `GET /api/v1/public/stores/{slug}/products`
- `POST /api/v1/public/leads/free`
- `POST /api/v1/public/leads/paid`
- `POST /api/v1/public/orders`

### Autenticacao

- `POST /api/v1/auth/merchant/login`
- `POST /api/v1/auth/admin/login`

### Lojista

- `GET /api/v1/merchant/dashboard`
- `GET /api/v1/merchant/orders`
- `PATCH /api/v1/merchant/orders/{id}/status`
- `GET /api/v1/merchant/products`
- `POST /api/v1/merchant/products`
- `PUT /api/v1/merchant/products/{id}`
- `DELETE /api/v1/merchant/products/{id}`
- `GET /api/v1/merchant/settings`
- `PUT /api/v1/merchant/settings`
- `GET /api/v1/merchant/option-groups`
- `POST /api/v1/merchant/option-groups`
- `PUT /api/v1/merchant/option-groups/{id}`
- `DELETE /api/v1/merchant/option-groups/{id}`
- `GET /api/v1/merchant/promotions`
- `POST /api/v1/merchant/promotions`
- `PUT /api/v1/merchant/promotions/{id}`
- `DELETE /api/v1/merchant/promotions/{id}`

### Super admin

- `GET /api/v1/admin/dashboard`
- `GET /api/v1/admin/stores`
- `PATCH /api/v1/admin/stores/{id}/status`
- `GET /api/v1/admin/logs`
- `GET /api/v1/admin/leads`
- `PATCH /api/v1/admin/leads/{id}/approve`

## Exemplos

Login lojista:

```json
POST /api/v1/auth/merchant/login
{
  "login": "joao@burgernaarea.com",
  "senha": "123456"
}
```

Criar pedido:

```json
POST /api/v1/public/orders
{
  "store_slug": "burger-na-area",
  "cliente_id": 1,
  "nome_cliente": "Maria Souza",
  "telefone_cliente": "11977776666",
  "tipo_entrega": "ENTREGA",
  "cep": "01001-000",
  "logradouro": "Rua das Flores",
  "numero": "120",
  "bairro": "Centro",
  "cidade": "Sao Paulo",
  "estado": "SP",
  "observacoes_cliente": "Sem cebola",
  "itens": [
    { "produto_id": 1, "quantidade": 1 },
    { "produto_id": 3, "quantidade": 1 }
  ]
}
```

Atualizar status de pedido:

```json
PATCH /api/v1/merchant/orders/2/status
Authorization: Bearer {token}
{
  "status": "SAIU_PARA_ENTREGA"
}
```

## Compatibilidade

Os endpoints antigos continuam disponiveis:

- `php/api/store-login.php`
- `php/api/store-products.php`
- `php/api/create-order.php`

Eles agora delegam para a API nova.

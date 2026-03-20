# Tutorial VPS Hostinger: Deploy Completo do Projeto Tem na Area

## 1. Objetivo

Este tutorial documenta o processo completo de deploy de um projeto full stack em uma VPS da Hostinger, com:

- frontend React + Vite
- backend Node.js + Express
- banco PostgreSQL no Supabase
- processo Node gerenciado com PM2
- frontend e proxy reverso servidos pelo Nginx

Ao final, a aplicacao fica acessivel assim:

- frontend: `http://IP_DO_SERVIDOR`
- API: `http://IP_DO_SERVIDOR/api/v1`

---

## 2. Arquitetura final

### Componentes usados

- VPS Ubuntu na Hostinger
- Nginx para servir o frontend e encaminhar a API
- PM2 para manter o backend ligado
- Supabase para o banco PostgreSQL
- GitHub para versionamento e atualizacao do codigo

### Fluxo de requisicao

1. O usuario acessa o IP ou dominio.
2. O Nginx entrega o frontend React gerado em `frontend/dist`.
3. Quando o frontend chama `/api/v1/...`, o Nginx repassa para `http://127.0.0.1:3001`.
4. O backend Node responde e, quando precisa, consulta o banco no Supabase.

---

## 3. Estrutura do projeto

```txt
tem-na-area/
  backend/
    node/
      src/
      package.json
      .env
  frontend/
    src/
    dist/
    package.json
  package.json
```

Pontos importantes:

- o repositorio e um monorepo
- a raiz tem um `package.json`
- a API real fica em `backend/node`
- o frontend real fica em `frontend`

---

## 4. Problema inicial encontrado

O primeiro erro foi:

```txt
npm error enoent Could not read package.json
```

Motivo:

- o comando `npm` estava sendo executado na pasta errada da VPS

No servidor, a estrutura estava assim:

```txt
/var/www/tem-na-area-api/
  tem-na-area/
```

Entao o lugar certo para rodar o projeto era:

```bash
cd /var/www/tem-na-area-api/tem-na-area
```

---

## 5. Ajuste feito no repositorio

Na raiz do projeto, foram adicionados scripts para facilitar o deploy:

```json
"scripts": {
  "dev": "npm run dev --workspace backend/node",
  "build": "npm run build --workspace frontend",
  "start": "npm run start --workspace backend/node",
  "start:api": "npm run start --workspace backend/node",
  "dev:api": "npm run dev --workspace backend/node",
  "check:api": "npm run check --workspace backend/node"
}
```

Com isso, `npm start` na raiz passou a iniciar a API correta.

---

## 6. Clonando e atualizando o projeto na VPS

Comandos usados:

```bash
cd /var/www/tem-na-area-api/tem-na-area
git pull origin main
npm install
npm start
```

---

## 7. Erro de conexao com banco

Depois da pasta correta, o erro mudou para:

```txt
Error: connect ECONNREFUSED 127.0.0.1:5432
```

Motivo:

- a API estava tentando conectar em um Postgres local
- mas o banco real estava no Supabase

Foi necessario configurar o arquivo `.env` do backend.

Local do arquivo:

```bash
/var/www/tem-na-area-api/tem-na-area/backend/node/.env
```

---

## 8. Configurando o .env do backend

Exemplo final usado:

```env
DATABASE_URL=postgresql://USUARIO:SENHA@aws-1-sa-east-1.pooler.supabase.com:5432/postgres
TEM_NA_AREA_DB_SSLMODE=require
TEM_NA_AREA_DB_SSL_REJECT_UNAUTHORIZED=false
NODE_TLS_REJECT_UNAUTHORIZED=0
TEM_NA_AREA_APP_ENV=production
TEM_NA_AREA_APP_URL=http://72.62.106.59
TEM_NA_AREA_APP_KEY=tem-na-area-chave-super-secreta-2026
TEM_NA_AREA_PORT=3001
CORS_ORIGIN=*
```

### Observacoes

- `DATABASE_URL` aponta para o pooler do Supabase
- `NODE_TLS_REJECT_UNAUTHORIZED=0` foi usado como ajuste pragmatico para o certificado
- `CORS_ORIGIN=*` foi usado para simplificar a fase inicial

---

## 9. Erro SSL com Supabase

Erro encontrado:

```txt
Error: self-signed certificate in certificate chain
```

Motivo:

- o cliente `pg` estava rejeitando o certificado do pooler

Solucao aplicada no codigo:

- tratamento mais explicito de SSL no arquivo de conexao do banco
- remocao do `sslmode` da URL antes de repassar ao `pg`
- suporte a:
  - `TEM_NA_AREA_DB_SSLMODE`
  - `TEM_NA_AREA_DB_SSL_REJECT_UNAUTHORIZED`

---

## 10. Erro de senha e credencial

Durante a troca da senha do Supabase, apareceu:

```txt
Tenant or user not found
```

e depois:

```txt
code: '28P01'
```

Motivos possiveis:

- usuario errado
- string montada manualmente com formato incorreto
- senha antiga
- senha nova com URL quebrada

Licao:

- copiar a string do `Connection pooling` do Supabase inteira
- evitar montar a URL manualmente

---

## 11. Publicando a API com PM2

Depois de ajustar o banco, a API foi colocada no PM2.

### Comandos

```bash
cd /var/www/tem-na-area-api/tem-na-area
pm2 start npm --name temnaarea -- start
pm2 save
pm2 startup
```

### Validacao

```bash
pm2 status
curl http://127.0.0.1:3001/api/v1/health
```

Se tudo estiver correto, o retorno sera parecido com:

```json
{"ok":true,"data":{"status":"ok","service":"tem-na-area-node-api"}}
```

---

## 12. Problema com EADDRINUSE

Erro encontrado:

```txt
Error: listen EADDRINUSE: address already in use :::3001
```

Motivo:

- ja existia um processo ocupando a porta 3001

Comandos usados para diagnostico:

```bash
lsof -i :3001
pm2 logs temnaarea --lines 50
```

Solucao:

```bash
pm2 delete temnaarea
pm2 start npm --name temnaarea -- start
```

---

## 13. Build do frontend no VPS

Para publicar o frontend no VPS, foi feito o build do React:

```bash
cd /var/www/tem-na-area-api/tem-na-area/frontend
npm install
npm run build
```

### Erro encontrado

```txt
Error: Cannot find module @rollup/rollup-linux-x64-gnu
```

### Solucao

```bash
npm install @rollup/rollup-linux-x64-gnu --save-dev
npm run build
```

Depois disso, foi criada a pasta:

```txt
frontend/dist
```

---

## 14. Configurando o Nginx

Arquivo editado:

```txt
/etc/nginx/sites-available/default
```

Conteudo final:

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;

    root /var/www/tem-na-area-api/tem-na-area/frontend/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Teste e reload

```bash
nginx -t
systemctl reload nginx
```

---

## 15. Ajuste no frontend para usar a API no mesmo host

Para o frontend funcionar direto no VPS, sem depender da Vercel, o fallback da API foi alterado.

Antes:

```js
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:3001/api/v1").replace(/\/+$/, "");
```

Depois:

```js
const defaultApiBaseUrl = import.meta.env.DEV ? "http://127.0.0.1:3001/api/v1" : "/api/v1";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl).replace(/\/+$/, "");
```

Com isso:

- localmente usa `http://127.0.0.1:3001/api/v1`
- em producao no VPS usa `/api/v1`

---

## 16. Testes finais

### Frontend

Abrir:

```txt
http://72.62.106.59
```

### API direta

```txt
http://72.62.106.59:3001/api/v1/health
```

### API via Nginx

```txt
http://72.62.106.59/api/v1/health
```

Resposta esperada:

```json
{"ok":true,"data":{"status":"ok","service":"tem-na-area-node-api"}}
```

---

## 17. Sequencia resumida de deploy

### Backend

```bash
cd /var/www/tem-na-area-api/tem-na-area
git pull origin main
npm install
pm2 start npm --name temnaarea -- start
pm2 save
```

### Frontend

```bash
cd /var/www/tem-na-area-api/tem-na-area/frontend
npm install
npm run build
systemctl reload nginx
```

---

## 18. Comandos de manutencao

### Ver status da API

```bash
pm2 status
```

### Ver logs

```bash
pm2 logs temnaarea --lines 50
```

### Reiniciar API

```bash
pm2 restart temnaarea --update-env
```

### Ver se porta 3001 esta ocupada

```bash
lsof -i :3001
```

### Testar API localmente

```bash
curl http://127.0.0.1:3001/api/v1/health
```

### Testar API pelo Nginx

```bash
curl http://72.62.106.59/api/v1/health
```

---

## 19. Licoes aprendidas

- confirmar a pasta certa antes de rodar `npm`
- em monorepo, deixar scripts claros na raiz ajuda muito
- sempre testar a API localmente com `curl` antes de culpar o Nginx
- `502 Bad Gateway` quase sempre significa que o upstream nao respondeu
- PM2 pode parecer online mesmo quando a aplicacao reinicia por erro
- copiar a string do Supabase inteira evita erro de credencial
- frontend em HTTPS chamando API em HTTP gera problema de mixed content
- servir frontend e API no mesmo host simplifica bastante

---

## 20. Melhorias futuras

- configurar dominio real
- habilitar HTTPS com Certbot
- remover `NODE_TLS_REJECT_UNAUTHORIZED=0`
- restringir `CORS_ORIGIN`
- documentar backup e restore do banco
- separar ambiente de homologacao e producao

---

## 21. Conclusao

O deploy final ficou estavel com:

- frontend no Nginx
- backend no PM2
- banco no Supabase
- API acessivel por `/api/v1`

Esse modelo e simples, barato e suficiente para um projeto pequeno ou medio hospedado em VPS.

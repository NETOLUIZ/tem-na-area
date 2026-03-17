# Frontend

Aplicacao React com Vite.

## Comandos

```powershell
npm install
npm run dev
npm run build
```

## API

Por padrao:

- em desenvolvimento, o frontend consome `http://127.0.0.1:3001/api/v1`
- em producao no mesmo host da API, o frontend consome `/api/v1`

Se precisar mudar, crie um `.env` em `frontend/`:

```env
VITE_API_BASE_URL=http://127.0.0.1:3001/api/v1
```

## Deploy no Vercel

Suba a pasta `frontend/` no Vercel e configure:

```env
VITE_API_BASE_URL=https://SUA-API.onrender.com/api/v1
```

O arquivo [vercel.json](c:/Users/acer/Documents/hublocal/frontend/vercel.json) ja aplica rewrite para o SPA funcionar em rotas internas.

## Deploy no Netlify

Se o frontend e a API forem para o mesmo site no Netlify, configure:

```env
VITE_API_BASE_URL=/api/api/v1
```

O [netlify.toml](c:/Users/acer/Documents/hublocal/netlify.toml) redireciona `/api/*` para `/.netlify/functions/api/*`.

## Estrutura principal

- `src/`: telas, componentes, contexto e utilitarios.
- `public/`: arquivos estaticos.
- `scripts/`: scripts auxiliares do frontend.

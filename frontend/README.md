# Frontend

Aplicacao React com Vite.

## Comandos

```powershell
npm install
npm run dev
npm run build
```

## API

Por padrao, o frontend consome `http://127.0.0.1:8000/api/v1`.

Se precisar mudar, crie um `.env` em `frontend/`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

## Estrutura principal

- `src/`: telas, componentes, contexto e utilitarios.
- `public/`: arquivos estaticos.
- `scripts/`: scripts auxiliares do frontend.

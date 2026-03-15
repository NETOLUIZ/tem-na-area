# Deploy no Render

Arquivos usados no deploy:

- `../../render.yaml`: blueprint com MySQL, API Node e frontend.
- `./mysql/Dockerfile`: imagem do MySQL 8 com import inicial do schema.

## Observacoes

- O MySQL carrega os arquivos SQL apenas na primeira inicializacao do volume.
- Se recriar o banco do zero, apague o service e o disk para forcar uma nova inicializacao.
- A API Node recebe host, porta e credenciais do banco via `fromService` no Blueprint.

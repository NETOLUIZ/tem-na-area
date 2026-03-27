# Design Tokens

Base visual mobile-first para o projeto.

## Cores

- `--color-primary`: vermelho principal
- `--color-bg`: fundo principal
- `--color-muted-1`: superfícies suaves
- `--color-muted-2`: bordas e divisórias
- `--color-text`: texto principal
- `--color-text-muted`: texto secundário
- `--color-on-primary`: texto sobre fundo primário
- `--color-error`: estados de erro

## Espaçamento

- `--space-xxs`: 4px
- `--space-xs`: 8px
- `--space-sm`: 12px
- `--space-md`: 16px
- `--space-lg`: 24px
- `--space-xl`: 32px

## Bordas e sombras

- `--radius-1`: 1rem
- `--radius-2`: 1.5rem
- `--shadow-soft`: sombra padrão
- `--shadow-elev`: sombra elevada

## Componentes base

- Botões: `.btn-primary`, `.btn-secondary`
- Estruturas: `.card`, `.stack`, `.inline-actions`
- Estados: `.muted`, `.error-text`
- Tabelas: `.table-wrap`, `.table`
- Modais: `.modal-overlay`, `.modal-box`

## Responsividade

- Base mobile-first
- `@media (min-width: 640px)`: tablet
- `@media (min-width: 1024px)`: desktop

## Regras

- Manter contraste legível
- Foco sempre visível
- Touch targets com pelo menos `44px`
- Preferir tokens ao invés de valores soltos

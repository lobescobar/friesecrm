# Etapa 12B — Correção do mapa após status Ativo/Inativo

## Problema corrigido

O TypeScript apontou erro em:

components/crm/MapaClientes.tsx

porque o projeto agora usa somente os status:

- Ativo
- Inativo

mas o mapa ainda tentava usar o fallback antigo:

icones.Novo

## Arquivo incluído

Substituir inteiro:

components/crm/MapaClientes.tsx

## Depois de copiar

Rode:

npm run typecheck
npm run lint
npm run build
npm run dev

## Observação

Nenhum SQL novo é necessário.
Essa correção não altera banco, dados, Supabase, importações ou permissões.

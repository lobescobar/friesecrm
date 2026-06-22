# Etapa 8 — Correção dos segmentos de clientes

## Regra de negócio confirmada

A origem do segmento do cliente é a coluna EK da planilha de cadastro de clientes.

Valores oficiais aceitos:

- Agroindustria
- Corrugados
- Tempera Indutiva
- Tratamento Termico

Células vazias na coluna EK devem ser desconsideradas.

## O que esta etapa corrige

1. O importador ERP passa a normalizar a coluna EK.
2. Valores vazios em EK deixam de sobrescrever segmentos já existentes.
3. Valores fora da lista oficial não são gravados como segmento.
4. O filtro de segmentos passa a mostrar somente os segmentos oficiais.
5. A gestão de usuários passa a usar a lista oficial de segmentos.
6. O SQL normaliza os dados já existentes em `clientes.segmento` e em `profiles.segmentos_permitidos`.

## Arquivos para substituir inteiros

Copie estes arquivos por cima do projeto:

```txt
components/crm/ImportarERP.tsx
components/crm/FiltrosClientes.tsx
components/crm/GestaoUsuarios.tsx
utils/constants.ts
```

## SQL

Antes de reimportar a planilha de clientes, execute no Supabase:

```txt
supabase/normalizar_segmentos_clientes.sql
```

O SQL não apaga clientes, mas normaliza o campo `segmento`.

Atenção: segmentos fora dos 4 oficiais serão definidos como `null`, porque a regra definida é desconsiderar valores vazios ou fora do padrão.

## Depois de copiar os arquivos

Na branch atual, rode:

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

## Depois reimporte a planilha de cadastro de clientes

Use novamente a planilha `Relação de Clientes.xlsx`.

Depois confira os filtros de segmento no CRM.

## Commit sugerido

```bash
git status
git add .
git commit -m "Corrige normalização de segmentos do ERP"
git push
```

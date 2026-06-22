# Etapa 7 — Incluir quantidade dos itens do orçamento

## Objetivo

No modal de detalhes de um orçamento, além de:

- Número item
- Descrição

passar a exibir também:

- Quantidade

A quantidade vem da coluna G da planilha de orçamentos.

## Banco de dados

Antes de reimportar a planilha, execute no Supabase:

```sql
alter table public.orcamentos_historico
add column if not exists quantidade_item numeric null;
```

Esse comando não apaga dados. Ele apenas adiciona a coluna `quantidade_item`.

## Arquivos alterados

Substituir inteiros:

- `components/crm/HistoricoCliente.tsx`
- `components/crm/ImportarOrcamentos.tsx`
- `types/index.ts`

## Depois de copiar os arquivos

Na branch `historico-cliente-orcamentos`, rode:

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

## Reimportar a planilha

Depois de executar o SQL e validar o build, reimporte:

- `Relatório de Orçamentos CRM.xlsx`

Isso é necessário para preencher a nova coluna `quantidade_item` com os valores da coluna G.

## Teste

1. Abra o CRM local.
2. Abra um cliente.
3. Clique em Histórico do Cliente.
4. Clique em um orçamento.
5. O modal de itens deve mostrar:
   - Número item
   - Descrição
   - Quantidade

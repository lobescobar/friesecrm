# Etapa 4B.1.6 — Funil Comercial: regras independentes por status e filtro mensal

Base de segurança:
`backup-mini-crm-mapa-apos-etapa4B1-2-corrigir-filtro-area-ramo-orcamentos-funcionando`

## Regra aplicada

Ao selecionar o período/mês no Funil Comercial, cada grupo passa a ser calculado de forma independente:

- Abertos: status `A` da coluna J + data de emissão da coluna N.
- Fechados: status `B` da coluna J + data de fechamento da coluna M.
- Cancelados: status `C` da coluna J + data de cancelamento da coluna R.
- Total analisado: data de emissão da coluna N.

## Filtros

Foram mantidos/adicionados:

- Área: coluna P / `ramo`.
- Período: ano.
- Mês: todos ou mês específico.

## Banco de dados

Rodar no Supabase antes de testar:

```sql
ALTER TABLE public.orcamentos_historico
ADD COLUMN IF NOT EXISTS data_cancelamento date NULL;

COMMENT ON COLUMN public.orcamentos_historico.data_cancelamento IS
'Data de cancelamento do orçamento importada da coluna R da planilha ERP. Usada no Funil Comercial para status C.';

CREATE INDEX IF NOT EXISTS idx_orcamentos_historico_data_cancelamento
ON public.orcamentos_historico (data_cancelamento);
```

Depois reimporte a planilha de orçamentos para preencher `data_cancelamento` nos registros.

## Arquivos

Substituir:

- `hooks/useFunilOrcamentos.ts`
- `components/crm/FunilOrcamentos.tsx`
- `utils/importacaoOrcamentos.ts`
- `types/importacaoOrcamentos.ts`
- `lib/importacaoOrcamentos.ts`

Adicionar:

- `supabase/migrations/20260703_add_data_cancelamento_orcamentos_historico.sql`

# Etapa 4B.1.3 — Valores monetários no Funil Comercial

Base preservada:

`backup-mini-crm-mapa-apos-etapa4B1-2-corrigir-filtro-area-ramo-orcamentos-funcionando`

## Objetivo

Inserir o valor financeiro do orçamento no Funil Comercial dentro da aba Orçamentos.

## Mapeamento oficial da planilha ERP

- Área: coluna P — `ramo`
- Período: coluna N — `data_emissao`
- Valor: coluna I — `Vlr.Total` — `valor_total`

## Banco

Rodar no Supabase SQL Editor:

```sql
ALTER TABLE public.orcamentos_historico
ADD COLUMN IF NOT EXISTS valor_total numeric(14, 2) NULL;

COMMENT ON COLUMN public.orcamentos_historico.valor_total IS
'Valor total do item/orçamento importado da coluna I da planilha ERP (Vlr.Total). Usado no Funil Comercial por volume financeiro.';

CREATE INDEX IF NOT EXISTS idx_orcamentos_historico_valor_total
ON public.orcamentos_historico (valor_total);
```

## Arquivos alterados

- `components/crm/FunilOrcamentos.tsx`
- `hooks/useFunilOrcamentos.ts`
- `utils/importacaoOrcamentos.ts`
- `types/importacaoOrcamentos.ts`
- `lib/importacaoOrcamentos.ts`

## Observação importante

Depois de aplicar o patch e rodar o SQL, reimporte a planilha de orçamentos para preencher `valor_total` nos registros já existentes.

## Testes

1. `npm run dev`
2. Abrir `CRM > Orçamentos`
3. Conferir o Funil Comercial por valor financeiro.
4. Testar filtros Área e Período.
5. Reimportar a planilha de orçamentos.
6. Rodar `npm run build`.

## Backup final sugerido

`backup-mini-crm-mapa-apos-etapa4B1-3-valores-funil-orcamentos-funcionando`

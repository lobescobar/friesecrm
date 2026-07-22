ALTER TABLE public.orcamentos_historico
ADD COLUMN IF NOT EXISTS valor_total numeric(14, 2) NULL;

COMMENT ON COLUMN public.orcamentos_historico.valor_total IS
'Valor total do item/orçamento importado da coluna I da planilha ERP (Vlr.Total). Usado no Funil Comercial por volume financeiro.';

CREATE INDEX IF NOT EXISTS idx_orcamentos_historico_valor_total
ON public.orcamentos_historico (valor_total);
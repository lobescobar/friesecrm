ALTER TABLE public.orcamentos_historico
ADD COLUMN IF NOT EXISTS data_cancelamento date NULL;

COMMENT ON COLUMN public.orcamentos_historico.data_cancelamento IS
'Data de cancelamento do orçamento importada da coluna R da planilha ERP. Usada no Funil Comercial para status C.';

CREATE INDEX IF NOT EXISTS idx_orcamentos_historico_data_cancelamento
ON public.orcamentos_historico (data_cancelamento);

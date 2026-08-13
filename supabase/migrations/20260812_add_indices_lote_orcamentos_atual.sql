-- Filtra funil, alerta e historico do cliente pelo ultimo lote importado.
-- Nao apaga dados antigos; apenas deixa a leitura do lote atual mais barata.

CREATE INDEX IF NOT EXISTS idx_orcamentos_historico_origem_updated_at
ON public.orcamentos_historico (origem_importacao, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_orcamentos_historico_ultimo_lote_orcamentos
ON public.orcamentos_historico (updated_at DESC)
WHERE origem_importacao LIKE 'planilha_orcamentos_crm:%';

CREATE INDEX IF NOT EXISTS idx_orcamentos_historico_lote_status_emissao
ON public.orcamentos_historico (origem_importacao, status, data_emissao);

CREATE INDEX IF NOT EXISTS idx_orcamentos_historico_lote_status_fechamento
ON public.orcamentos_historico (origem_importacao, status, data_fechamento);

CREATE INDEX IF NOT EXISTS idx_orcamentos_historico_lote_status_cancelamento
ON public.orcamentos_historico (origem_importacao, status, data_cancelamento);

CREATE INDEX IF NOT EXISTS idx_orcamentos_historico_lote_cliente_emissao
ON public.orcamentos_historico (origem_importacao, cliente_id, data_emissao);

CREATE INDEX IF NOT EXISTS idx_orcamentos_historico_lote_emissao_cliente
ON public.orcamentos_historico (origem_importacao, data_emissao, cliente_id);

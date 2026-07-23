-- Etapa 4B.1.11
-- Índices para evitar timeout no Funil Comercial.
-- Não apaga dados. Apenas melhora as consultas por status, área e data.

CREATE INDEX IF NOT EXISTS idx_orcamentos_historico_funil_status_emissao
ON public.orcamentos_historico (status, data_emissao);

CREATE INDEX IF NOT EXISTS idx_orcamentos_historico_funil_status_fechamento
ON public.orcamentos_historico (status, data_fechamento);

CREATE INDEX IF NOT EXISTS idx_orcamentos_historico_funil_status_cancelamento
ON public.orcamentos_historico (status, data_cancelamento);

CREATE INDEX IF NOT EXISTS idx_orcamentos_historico_funil_status_ramo
ON public.orcamentos_historico (status, ramo);

CREATE INDEX IF NOT EXISTS idx_orcamentos_historico_funil_valor_total
ON public.orcamentos_historico (valor_total);

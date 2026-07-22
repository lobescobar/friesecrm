-- Etapa 4B.1.12 — Índices auxiliares para Total Orçado e Cancelados no Funil Comercial
-- Não apaga dados. Apenas melhora performance dos filtros usados no funil.

CREATE INDEX IF NOT EXISTS idx_orcamentos_historico_funil_total_emissao
ON public.orcamentos_historico (status, data_emissao, ramo);

CREATE INDEX IF NOT EXISTS idx_orcamentos_historico_funil_cancelados_cancelamento
ON public.orcamentos_historico (status, data_cancelamento, ramo);

CREATE INDEX IF NOT EXISTS idx_orcamentos_historico_funil_cancelados_emissao_fallback
ON public.orcamentos_historico (status, data_emissao, ramo)
WHERE data_cancelamento IS NULL;

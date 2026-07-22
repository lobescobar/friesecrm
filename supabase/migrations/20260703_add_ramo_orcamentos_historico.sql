-- Etapa 4B.1.2 — Filtro Área do Funil Comercial
-- Adiciona o campo ramo, vindo da coluna P da planilha de orçamentos.

ALTER TABLE public.orcamentos_historico
ADD COLUMN IF NOT EXISTS ramo text NULL;

COMMENT ON COLUMN public.orcamentos_historico.ramo IS
'Área/ramo do orçamento importado da coluna P da planilha ERP. Usado no filtro Área do funil comercial.';

CREATE INDEX IF NOT EXISTS idx_orcamentos_historico_ramo
ON public.orcamentos_historico (ramo);

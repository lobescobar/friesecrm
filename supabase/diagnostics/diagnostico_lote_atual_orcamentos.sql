-- Diagnostico do lote atual de orcamentos.
-- Use depois de confirmar uma nova importacao completa da planilha.

WITH ultimo_lote AS (
  SELECT origem_importacao
  FROM public.orcamentos_historico
  WHERE origem_importacao LIKE 'planilha_orcamentos_crm:%'
  ORDER BY updated_at DESC
  LIMIT 1
),
linhas_lote AS (
  SELECT oh.*
  FROM public.orcamentos_historico oh
  JOIN ultimo_lote ul
    ON ul.origem_importacao = oh.origem_importacao
)
SELECT
  origem_importacao AS ultimo_lote_orcamentos
FROM ultimo_lote;

WITH ultimo_lote AS (
  SELECT origem_importacao
  FROM public.orcamentos_historico
  WHERE origem_importacao LIKE 'planilha_orcamentos_crm:%'
  ORDER BY updated_at DESC
  LIMIT 1
),
linhas_lote AS (
  SELECT oh.*
  FROM public.orcamentos_historico oh
  JOIN ultimo_lote ul
    ON ul.origem_importacao = oh.origem_importacao
)
SELECT
  status,
  COUNT(*) AS itens,
  COUNT(DISTINCT codigo_cliente_loja || '|' || numero_orcamento) AS orcamentos_unicos,
  SUM(valor_total) AS valor_total
FROM linhas_lote
GROUP BY status
ORDER BY status;

WITH ultimo_lote AS (
  SELECT origem_importacao
  FROM public.orcamentos_historico
  WHERE origem_importacao LIKE 'planilha_orcamentos_crm:%'
  ORDER BY updated_at DESC
  LIMIT 1
),
linhas_lote AS (
  SELECT oh.*
  FROM public.orcamentos_historico oh
  JOIN ultimo_lote ul
    ON ul.origem_importacao = oh.origem_importacao
)
SELECT
  COUNT(DISTINCT codigo_cliente_loja || '|' || numero_orcamento)
    FILTER (WHERE status = 'A') AS abertos_unicos,
  COUNT(DISTINCT codigo_cliente_loja || '|' || numero_orcamento)
    FILTER (WHERE status = 'B') AS fechados_unicos,
  COUNT(DISTINCT codigo_cliente_loja || '|' || numero_orcamento)
    FILTER (WHERE status = 'C') AS cancelados_unicos,
  COUNT(DISTINCT codigo_cliente_loja || '|' || numero_orcamento)
    AS total_unico_lote
FROM linhas_lote;

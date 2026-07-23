-- Diagnóstico do Funil Comercial por status, data e valor
-- Use depois de reimportar a planilha de orçamentos.

SELECT
  COUNT(*) AS total_linhas,
  COUNT(valor_total) AS linhas_com_valor_total,
  COUNT(data_emissao) AS linhas_com_data_emissao,
  COUNT(data_fechamento) AS linhas_com_data_fechamento,
  COUNT(data_cancelamento) AS linhas_com_data_cancelamento,
  SUM(valor_total) AS soma_geral_valor_total
FROM public.orcamentos_historico;

SELECT
  'Abertos' AS grupo,
  COUNT(*) AS linhas,
  SUM(valor_total) AS soma_valor_total
FROM public.orcamentos_historico
WHERE status = 'A'

UNION ALL

SELECT
  'Fechados' AS grupo,
  COUNT(*) AS linhas,
  SUM(valor_total) AS soma_valor_total
FROM public.orcamentos_historico
WHERE status = 'B'

UNION ALL

SELECT
  'Cancelados' AS grupo,
  COUNT(*) AS linhas,
  SUM(valor_total) AS soma_valor_total
FROM public.orcamentos_historico
WHERE status = 'C';

SELECT
  COUNT(*) AS fechados_2025_linhas,
  SUM(valor_total) AS fechados_2025_valor
FROM public.orcamentos_historico
WHERE status = 'B'
  AND data_fechamento >= DATE '2025-01-01'
  AND data_fechamento < DATE '2026-01-01';

SELECT
  COUNT(*) AS fechados_2025_sem_valor
FROM public.orcamentos_historico
WHERE status = 'B'
  AND data_fechamento >= DATE '2025-01-01'
  AND data_fechamento < DATE '2026-01-01'
  AND valor_total IS NULL;

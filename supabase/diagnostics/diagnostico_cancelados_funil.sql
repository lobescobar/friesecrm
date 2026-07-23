-- Diagnóstico do Funil Comercial — cancelados por Data Cancela
-- Esperado para a planilha enviada: Status C + Data Cancela 2025 = R$ 59.221.314,81

SELECT
  COUNT(*) AS linhas_canceladas_2025,
  SUM(valor_total) AS soma_cancelados_2025
FROM public.orcamentos_historico
WHERE status = 'C'
  AND data_cancelamento >= DATE '2025-01-01'
  AND data_cancelamento < DATE '2026-01-01';

SELECT
  COUNT(*) AS cancelados_sem_data_cancelamento
FROM public.orcamentos_historico
WHERE status = 'C'
  AND data_cancelamento IS NULL;

SELECT
  EXTRACT(YEAR FROM data_cancelamento) AS ano_cancelamento,
  COUNT(*) AS linhas,
  SUM(valor_total) AS soma_valor_total
FROM public.orcamentos_historico
WHERE status = 'C'
  AND data_cancelamento IS NOT NULL
GROUP BY EXTRACT(YEAR FROM data_cancelamento)
ORDER BY ano_cancelamento DESC;

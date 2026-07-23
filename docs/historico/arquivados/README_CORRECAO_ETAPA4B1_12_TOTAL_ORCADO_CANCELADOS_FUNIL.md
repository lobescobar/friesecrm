# Etapa 4B.1.12 — Alinhar Total Orçado e Cancelados no Funil

## Base
backup-mini-crm-mapa-apos-etapa4B1-11-corrigir-timeout-funil-consulta-otimizada-funcionando

## Regra aplicada

- Abertos: status A + data_emissao.
- Fechados: status B + data_fechamento.
- Cancelados: status C + data_cancelamento.
- Cancelados com data_cancelamento vazia: fallback temporário por data_emissao.
- Total analisado / orçado: todos os status A, B e C usando data_emissao.

## Arquivo alterado

- hooks/useFunilOrcamentos.ts

## SQL recomendado

Rodar o arquivo:

supabase/migrations/20260703_add_indices_total_orcado_cancelados_funil.sql

## Observação

O fallback de cancelados por data_emissao foi incluído porque o diagnóstico anterior mostrou data_cancelamento zerada no Supabase.
Quando a importação da coluna R estiver 100% preenchida, o fallback pode ser removido em uma etapa posterior.

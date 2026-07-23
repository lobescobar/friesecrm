# Etapa 4B.1.13 — Corrigir cancelados por Data Cancela e total do funil

## Base anterior

backup-mini-crm-mapa-apos-etapa4B1-12-total-orcado-cancelados-funil-funcionando

## Regra corrigida

- Abertos: Status A + DT Emissao
- Fechados: Status B + Fechamento
- Cancelados: Status C + Data Cancela
- Total analisado: soma dos três grupos exibidos no funil

## Arquivos alterados

- hooks/useFunilOrcamentos.ts
- lib/importacaoOrcamentos.ts

## Motivo

A planilha confirma que, usando somente Status C e Data Cancela em 2025, a soma correta da coluna Vlr.Total é:

R$ 59.221.314,81

O CRM estava mostrando R$ 47.481.429 porque ainda usava fallback por DT Emissao quando data_cancelamento não estava preenchida.

Além disso, o importador processava data_cancelamento, mas ela não estava sendo enviada no upsert para o Supabase. Isso impedia preencher a coluna data_cancelamento ao reimportar.

## Depois de aplicar

1. Substituir os arquivos.
2. Rodar npm run dev.
3. Reimportar a planilha de orçamentos completa.
4. Rodar supabase/diagnostics/diagnostico_cancelados_funil.sql no SQL Editor.
5. Conferir se cancelados 2025 fica próximo de R$ 59.221.314,81.

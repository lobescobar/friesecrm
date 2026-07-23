# Etapa 4B.1.10 — Importação completa para o Funil Comercial

## Base
backup-mini-crm-mapa-apos-etapa4B1-9-corrigir-periodo-status-data-valor-funcionando

## Problema identificado
A tabela `orcamentos_historico` já possui as colunas corretas:

- `valor_total`
- `data_fechamento`
- `data_cancelamento`
- `ramo`

Mas o diagnóstico mostrou:

- `total_linhas`: 6933
- `linhas_com_valor_total`: 3243
- `linhas_com_data_cancelamento`: 0
- registros B de 2025 sem `valor_total`: 70

Isso indica que a importação ainda não estava gravando todo o histórico necessário para o funil. O importador estava descartando linhas antigas usando a data de emissão como limite de histórico.

## Correção aplicada
O arquivo `lib/importacaoOrcamentos.ts` foi ajustado para:

1. Importar o histórico completo da planilha de orçamentos.
2. Não descartar linhas antigas por `data_emissao`.
3. Continuar salvando:
   - coluna I como `valor_total`
   - coluna M como `data_fechamento`
   - coluna N como `data_emissao`
   - coluna P como `ramo`
   - coluna R como `data_cancelamento`

## Arquivos para substituir
- `lib/importacaoOrcamentos.ts`
- `utils/importacaoOrcamentos.ts`
- `types/importacaoOrcamentos.ts`

## Arquivo de diagnóstico
- `supabase/diagnostics/diagnostico_funil_orcamentos.sql`

## Teste obrigatório
Depois de aplicar, reimporte a planilha de orçamentos completa.

Em seguida rode o diagnóstico no Supabase e confira se:

- `linhas_com_valor_total` fica próximo de `total_linhas`
- `data_cancelamento` passa a ser preenchida quando houver status C com coluna R
- Fechados 2025 se aproxima do total esperado da planilha

## Observação
Nenhum SQL destrutivo foi incluído. Não há DROP, DELETE ou TRUNCATE.

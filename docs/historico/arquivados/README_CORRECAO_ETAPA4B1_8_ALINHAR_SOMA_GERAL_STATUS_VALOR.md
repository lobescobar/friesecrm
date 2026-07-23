# Etapa 4B.1.8 — Alinhar soma geral do Funil por Status e Valor

Base anterior:
backup-mini-crm-mapa-apos-etapa4B1-7-corrigir-agrupamento-status-data-funil-funcionando

## Regra aplicada

Nesta etapa o cálculo geral do funil foi simplificado para alinhar com a planilha ERP:

- Valor financeiro: coluna I da planilha ERP (`Vlr.Total`) → campo `valor_total`
- Abertos: coluna J (`Status`) = `A`
- Fechados: coluna J (`Status`) = `B`
- Cancelados: coluna J (`Status`) = `C`

O valor financeiro é somado diretamente pelas linhas de orçamento conforme o status.

## Arquivo alterado

- `hooks/useFunilOrcamentos.ts`

## Observação

A quantidade exibida continua agrupando por orçamento principal/status para evitar inflar a quantidade por item. A soma financeira, porém, considera todas as linhas com `Vlr.Total`.

## Teste

1. Aplicar o arquivo.
2. Parar o servidor.
3. Limpar `.next`, se necessário.
4. Rodar `npm run dev`.
5. Abrir `CRM > Orçamentos`.
6. Selecionar Área = Todas, Período = Todos, Mês = Todos.
7. Comparar os totais financeiros com a planilha:
   - Abertos = soma de `Vlr.Total` onde status = `A`
   - Fechados = soma de `Vlr.Total` onde status = `B`
   - Cancelados = soma de `Vlr.Total` onde status = `C`

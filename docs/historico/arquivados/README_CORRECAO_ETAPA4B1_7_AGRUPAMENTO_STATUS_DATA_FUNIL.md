# Etapa 4B.1.7 — Corrigir agrupamento do funil por status e data

Base de referência:
backup-mini-crm-mapa-apos-etapa4B1-6-regras-periodo-mensal-funil-funcionando

## Objetivo

Corrigir a regra do Funil Comercial para calcular cada grupo de forma independente,
somando os orçamentos que tenham o mesmo status e a mesma data de referência.

## Regra aplicada

- Abertos: status A, data de emissão (`data_emissao`, coluna N)
- Fechados: status B, data de fechamento (`data_fechamento`, coluna M)
- Cancelados: status C, data de cancelamento (`data_cancelamento`, coluna R)

O agrupamento passa a considerar:

`codigo_cliente_loja + numero_orcamento + status + data_referencia`

Assim, o funil deixa de converter o orçamento para um único status final por prioridade.
Cada status é calculado independentemente pela sua própria data.

## Arquivo alterado

- `hooks/useFunilOrcamentos.ts`

## Observação

Não há novo SQL nesta etapa.
A coluna `data_cancelamento` precisa existir e os orçamentos devem ter sido reimportados depois da etapa 4B.1.6.

## Teste

1. Rodar `npm run dev`.
2. Abrir `CRM > Orçamentos`.
3. Selecionar área, período e mês.
4. Conferir os números contra a planilha usando:
   - status A + DT Emiss
   - status B + Fechamen
   - status C + Data Canc
5. Rodar `npm run build`.

## Backup após validação

`backup-mini-crm-mapa-apos-etapa4B1-7-corrigir-agrupamento-status-data-funil-funcionando`

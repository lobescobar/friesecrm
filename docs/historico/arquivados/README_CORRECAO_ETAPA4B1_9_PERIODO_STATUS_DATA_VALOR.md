# Etapa 4B.1.9 — Corrigir período por status/data no Funil Comercial

Base anterior:
backup-mini-crm-mapa-apos-etapa4B1-8-alinhar-soma-geral-status-valor-funcionando

## Objetivo

Corrigir o funil para aplicar o filtro de período/mês usando a data correta de cada status:

- Abertos: Status A da coluna J + DT Emissao da coluna N
- Fechados: Status B da coluna J + Fechamento da coluna M
- Cancelados: Status C da coluna J + Data Cancela da coluna R

A soma de valores continua usando:

- Vlr.Total da coluna I = valor_total

## Arquivo alterado

- hooks/useFunilOrcamentos.ts

## Correção técnica

Antes, a filtragem podia considerar qualquer data da linha.
Agora a data de referência é definida pelo status:

- A -> data_emissao
- B -> data_fechamento
- C -> data_cancelamento

A quantidade também passa a agrupar por:

codigo_cliente_loja + número principal do orçamento + status + data de referência

O valor financeiro continua somando todas as linhas de Vlr.Total.

## Atenção

Se anos antigos, como 2023 e 2024, continuarem com valor R$ 0, mas com quantidade preenchida,
isso indica que esses registros no Supabase ainda estão com valor_total vazio/null.
Nesse caso, reimporte a planilha de orçamentos depois de confirmar que a coluna I está sendo salva em valor_total.

## Teste

1. Rodar:
npm run dev

2. Abrir:
CRM > Orçamentos

3. Testar:
Área: Todas
Período: 2025
Mês: Todos

4. Conferir Fechados:
Status B + Fechamento em 2025 + soma de Vlr.Total.

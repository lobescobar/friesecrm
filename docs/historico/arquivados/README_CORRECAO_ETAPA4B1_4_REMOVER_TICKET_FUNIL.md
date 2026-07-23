# Etapa 4B.1.4 — Remover ticket médio do Funil Comercial

Base anterior:
backup-mini-crm-mapa-apos-etapa4B1-3-valores-funil-orcamentos-funcionando

## Objetivo

Remover a exibição de ticket médio do Funil Comercial, porque essa informação não é necessária para a operação atual.

## Arquivo alterado

- components/crm/FunilOrcamentos.tsx

## O que mudou

Antes os cards exibiam:

- quantidade de orçamentos
- ticket médio
- valor total

Agora exibem apenas:

- quantidade de orçamentos
- valor total

O card "Total analisado" também deixa de mostrar ticket médio.

## Observação técnica

A estrutura de cálculo no hook foi preservada para não alterar regra de negócio nem quebrar futuras análises. A alteração é apenas visual: o campo `ticketMedio` deixa de ser exibido na interface.

## Testes recomendados

1. Rodar `npm run dev`.
2. Abrir CRM > Orçamentos.
3. Conferir se a palavra "ticket" não aparece mais no funil.
4. Conferir se valores totais e quantidades continuam aparecendo.
5. Rodar `npm run build`.

## Backup após validar

backup-mini-crm-mapa-apos-etapa4B1-4-remover-ticket-funil-funcionando

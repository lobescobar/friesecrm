# Etapa 4B.1.5 — Corrigir regras de período do Funil Comercial

Base anterior:
backup-mini-crm-mapa-apos-etapa4B1-4-remover-ticket-funil-funcionando

Backup recomendado antes de aplicar:
backup-mini-crm-mapa-antes-etapa4B1-5-corrigir-regras-periodo-funil

## Arquivos alterados

- hooks/useFunilOrcamentos.ts
- components/crm/FunilOrcamentos.tsx

## Regras aplicadas

- Área continua usando `ramo`, origem coluna P da planilha ERP.
- Período considera anos existentes em emissão e fechamento.
- Abertos: entram no período pela data de emissão.
- Fechados: entram no período pela data de fechamento, independente da emissão.
- Cancelados: entram no período pela data de emissão, independente de data de cancelamento.
- Total analisado: entra no período pela data de emissão.
- Vendedor continua limitado ao ano corrente.
- Admin pode selecionar todos os períodos.
- Texto abaixo de Funil Comercial passa a exibir somente: `Volume financeiro`.

## Teste

1. Substituir os arquivos.
2. Parar o servidor.
3. Limpar cache `.next`, se necessário.
4. Rodar `npm run dev`.
5. Abrir CRM > Orçamentos.
6. Testar Área e Período.
7. Conferir especialmente anos em que existem fechamentos com emissão de outro ano.
8. Rodar `npm run build`.

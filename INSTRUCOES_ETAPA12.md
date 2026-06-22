# Etapa 12 — Status do cliente por orçamento nos últimos 18 meses

## Objetivo

Alterar a regra de status dos CLIENTES.

A partir desta etapa, o cliente deve ter somente dois status:

- Ativo
- Inativo

## Regra aprovada

- Cliente Ativo: possui ao menos um orçamento com `data_emissao` nos últimos 18 meses.
- Cliente Inativo: último orçamento tem mais de 18 meses ou o cliente não possui histórico de orçamento.

## O que muda no sistema

1. Remove as opções antigas de status de cliente:
   - Novo
   - Proposta

2. Mantém somente:
   - Ativo
   - Inativo

3. O filtro de Status passa a mostrar somente:
   - Todos
   - Ativo
   - Inativo

4. A aba Dados do cliente deixa de editar o status manualmente.
   O status fica apenas informativo e calculado pelo histórico de orçamentos.

5. A importação ERP não deve sobrescrever status de cliente já existente.
   Para cliente novo, o status inicial será Inativo até existir orçamento recente.

6. A importação de Orçamentos recalcula os status automaticamente ao final:
   - primeiro marca todos como Inativo;
   - depois marca como Ativo quem tiver orçamento nos últimos 18 meses.

## Arquivos para substituir

- utils/constants.ts
- components/ui/BadgeStatus.tsx
- components/crm/ClienteModal.tsx
- components/crm/cliente-modal/ClienteDados.tsx
- components/crm/ImportarERP.tsx
- components/crm/ImportarOrcamentos.tsx

## SQL para executar no Supabase

Executar o arquivo:

- supabase/recalcular_status_clientes_18_meses.sql

Este SQL não apaga dados. Ele apenas recalcula `clientes.status`.

## Ordem recomendada

1. Confirmar que está na branch:
   ```bash
   git branch
   ```

   Deve aparecer:
   ```txt
   * historico-cliente-orcamentos
   ```

2. Copiar os arquivos deste pacote por cima do projeto.

3. Executar no Supabase o SQL:
   ```txt
   supabase/recalcular_status_clientes_18_meses.sql
   ```

4. Rodar no VS Code:
   ```bash
   npm run typecheck
   npm run lint
   npm run build
   npm run dev
   ```

5. Testar no CRM local:
   - filtro de status mostra só Ativo e Inativo;
   - clientes aparecem com badge Ativo/Inativo;
   - abrir cliente;
   - aba Dados mostra status informativo, sem edição manual;
   - importar Orçamentos recalcula status no final;
   - cliente sem histórico aparece como Inativo.

## Commit sugerido

```bash
git status
git add .
git commit -m "Calcula status do cliente por orçamento nos últimos 18 meses"
git push
```

Não fazer merge para `main` antes da validação.

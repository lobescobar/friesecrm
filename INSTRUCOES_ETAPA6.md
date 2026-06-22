# Etapa 6 — Alerta clicável e detalhes dos itens do orçamento

## Objetivo

Esta etapa melhora a tela de histórico de orçamentos:

1. O alerta da tela inicial passa a mostrar a mensagem:
   - `Existem X orçamentos em aberto.`

2. Ao clicar em um orçamento em aberto na lista do alerta:
   - o sistema fecha o alerta;
   - abre o modal do cliente correspondente;
   - já abre a área `Histórico do Cliente`;
   - destaca o orçamento selecionado.

3. No Histórico do Cliente:
   - o orçamento continua agrupado pelo número principal;
   - ao clicar no número do orçamento, abre uma tela/modal de detalhes;
   - essa tela mostra:
     - Número item;
     - Descrição da coluna F da planilha.

## Antes de copiar os arquivos

Confirme que você está na branch:

```bash
git branch
```

O ideal é aparecer:

```txt
* historico-cliente-orcamentos
```

## SQL obrigatório

Antes de reimportar a planilha, execute no Supabase:

```sql
alter table public.orcamentos_historico
add column if not exists descricao_item text null;
```

Esse SQL não apaga nada. Ele só adiciona a coluna que vai guardar a descrição do item.

O arquivo também está em:

```txt
supabase/alter_orcamentos_historico_descricao_item.sql
```

## Arquivos para substituir inteiros

- `app/crm/page.tsx`
- `components/crm/AlertaOrcamentosAbertos.tsx`
- `components/crm/ClienteModal.tsx`
- `components/crm/HistoricoCliente.tsx`
- `components/crm/ImportarOrcamentos.tsx`
- `hooks/useHistoricoCliente.ts`
- `hooks/useOrcamentosAbertos.ts`
- `types/index.ts`

## Depois de copiar

Rode:

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

## Reimportar a planilha

Depois do SQL e dos testes, reimporte:

```txt
Relatório de Orçamentos CRM.xlsx
```

Isso é necessário para preencher a nova coluna `descricao_item`.

## Testes

1. Abra `http://localhost:3000/crm`.
2. Veja se aparece: `Existem X orçamentos em aberto.`
3. Clique em `Visualizar abertos`.
4. Clique em um orçamento da lista.
5. Confirme se abriu o cliente diretamente no Histórico do Cliente.
6. Clique no número de um orçamento no histórico.
7. Confirme se abriu a tela/modal com:
   - Número item;
   - Descrição.

## Commit depois de validar

```bash
git status
git add .
git commit -m "Melhora alerta de abertos e adiciona detalhe de itens do orçamento"
git push
```

Ainda não faça merge na `main` antes de validar localmente.

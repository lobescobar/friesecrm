# Etapa 4 — Histórico agrupado por orçamento principal

## Objetivo

Ajustar o Histórico do Cliente para:

1. Exibir somente o número principal do orçamento, sem listar cada item.
   - Exemplo: mostrar `014385` em vez de `014385-01`, `014385-02`, `014385-03`.
2. Exibir a data de emissão do orçamento, coluna N da planilha.
3. Exibir a data de fechamento, coluna M da planilha, quando houver.

## Antes de aplicar

Confirme que você está na branch:

```bash
git branch
```

A branch ativa deve ser:

```txt
* historico-cliente-orcamentos
```

## 1. Executar SQL no Supabase

No Supabase SQL Editor, execute o arquivo:

```txt
supabase/alter_orcamentos_historico_data_fechamento.sql
```

Esse SQL apenas adiciona a coluna `data_fechamento` e cria índice. Ele não apaga dados.

## 2. Substituir arquivos

Copie o conteúdo deste pacote por cima da raiz do projeto.

Arquivos alterados:

```txt
types/index.ts
components/crm/HistoricoCliente.tsx
components/crm/ImportarOrcamentos.tsx
supabase/orcamentos_historico.sql
```

Arquivo novo:

```txt
supabase/alter_orcamentos_historico_data_fechamento.sql
```

## 3. Rodar validações

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

## 4. Reimportar planilha de orçamentos

Para preencher a nova coluna `data_fechamento`, faça nova importação da planilha:

```txt
Relatório de Orçamentos CRM.xlsx
```

O importador usa `upsert`, então os registros existentes serão atualizados com a data de fechamento quando houver.

## Resultado esperado

No modal do cliente, em Histórico do Cliente, a lista passa a mostrar:

```txt
Data emissão | Data fechamento | Orçamento | Pedido venda | Status
```

O orçamento aparecerá agrupado pelo número principal.

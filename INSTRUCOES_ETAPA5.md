# Etapa 5 — Histórico ordenado e alerta de orçamentos em aberto

## Objetivo

Esta etapa faz três melhorias:

1. Reordena as colunas do Histórico do Cliente:
   - Orçamento
   - Data de emissão
   - Pedido de venda
   - Data de fechamento
   - Status

2. Adiciona filtros/ordenação no Histórico do Cliente:
   - ordenação por Orçamento
   - ordenação por Data de emissão
   - ordenação por Pedido de venda
   - ordenação por Data de fechamento
   - filtro de Status: Todos, Abertos, Fechados e Cancelados

3. Adiciona alerta na tela inicial do CRM sempre que houver orçamentos em aberto:
   - o alerta aparece acima dos indicadores/mapa;
   - ao clicar em "Visualizar abertos", abre uma tela com:
     - Nº Cliente
     - Nome
     - Nº Orçamento
     - Data de emissão

## Arquivos alterados ou criados

Substituir arquivo inteiro:

- app/crm/page.tsx
- components/crm/CrmHeader.tsx
- components/crm/HistoricoCliente.tsx
- components/crm/ImportarOrcamentos.tsx

Criar arquivo novo:

- hooks/useOrcamentosAbertos.ts
- components/crm/AlertaOrcamentosAbertos.tsx

## Banco de dados

Esta etapa não precisa de novo SQL.

Ela usa a tabela já criada:

- public.orcamentos_historico

E usa a coluna já adicionada anteriormente:

- data_fechamento

## Como aplicar

Na branch atual:

```bash
git branch
```

Confirme que está em:

```txt
historico-cliente-orcamentos
```

Depois copie os arquivos deste pacote por cima do projeto.

## Testar

Rode:

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

Acesse:

```txt
http://localhost:3000/crm
```

Teste:

1. Verifique se aparece o alerta de orçamentos em aberto na tela inicial.
2. Clique em "Visualizar abertos".
3. Confirme se aparece a lista com Nº Cliente, Nome, Nº Orçamento e Data de emissão.
4. Abra um cliente.
5. Clique em Histórico do Cliente.
6. Confirme se as colunas aparecem na ordem:
   - Orçamento
   - Data de emissão
   - Pedido de venda
   - Data de fechamento
   - Status
7. Teste a ordenação clicando nos cabeçalhos da tabela.
8. Teste o filtro de status.

## Commit sugerido

Se tudo passar:

```bash
git status
git add .
git commit -m "Melhora histórico e adiciona alerta de orçamentos em aberto"
git push
```

Ainda não fazer merge para a main antes da validação local.

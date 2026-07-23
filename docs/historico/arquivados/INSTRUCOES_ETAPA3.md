# Etapa 3 — Importação inicial de orçamentos

## Objetivo

Adicionar o botão **Importar Orçamentos** para administradores.

Esta etapa importa para a tabela `orcamentos_historico` somente os dados mínimos definidos:

- código do cliente + loja;
- número do orçamento/item da coluna A;
- pedido de venda da coluna L, quando houver;
- status A, B ou C;
- data de emissão;
- vínculo com `clientes.id`.

## Regras aplicadas

- A raiz do histórico é `codigo_cliente + loja`.
- O período importado é de 36 meses, comparando a data atual com `DT Emissao`.
- Status A = Aberto.
- Status B = Fechado.
- Status C = Cancelado / Perdido.
- Status D é desconsiderado.
- Vendedor é desconsiderado nesta fase.
- Orçamentos sem cliente correspondente são ignorados e aparecem no resumo.
- Cabeçalhos repetidos dentro da planilha são ignorados.

## Arquivos incluídos

### Substituir arquivo inteiro

- `components/crm/CrmHeader.tsx`
- `components/crm/ClienteModal.tsx`
- `components/crm/HistoricoCliente.tsx`
- `hooks/useHistoricoCliente.ts`
- `types/index.ts`

### Criar arquivo novo

- `components/crm/ImportarOrcamentos.tsx`

### Registro do SQL já executado

- `supabase/orcamentos_historico.sql`

## Como aplicar

Copie as pastas deste pacote por cima da raiz do projeto, mantendo a branch:

```bash
historico-cliente-orcamentos
```

Depois execute:

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

## Como testar

1. Acesse `http://localhost:3000/crm`.
2. Faça login como administrador.
3. Clique em **Importar Orçamentos**.
4. Selecione a planilha `Relatório de Orçamentos CRM.xlsx`.
5. Confira o resumo antes de confirmar.
6. Clique em **Confirmar importação**.
7. Abra um cliente que tenha orçamento nos últimos 36 meses.
8. Clique em **Histórico do Cliente**.

## Observação importante

Esta versão ainda não mostra valor, produto, quantidade, vendedor ou detalhes de itens. Isso será expandido em etapas futuras.

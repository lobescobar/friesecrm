# Etapa 14R — Corrigir contagem de Orçamentos em aberto por orçamento principal e status

## Problema

A correção anterior passou a buscar status `A`, `B` e `C`, mas a consulta ao Supabase ficou limitada à primeira página de resultados.

Como o Supabase retorna até 1000 linhas por consulta quando não há paginação manual, a tela passou a receber apenas parte da tabela `orcamentos_historico`. Por isso a lista caiu para poucos orçamentos em aberto.

## Análise da planilha enviada

Arquivo analisado:

```txt
Orçamentos 24-06.xlsx
```

Cabeçalho encontrado na linha 4:

```txt
A = Numero It
B = Cliente
C = Loja
J = Status
K = Motivo Canc.
L = Pedido Venda
M = Fechamento
N = DT Emissao
```

Observação importante: na planilha enviada, o campo `Status` está na coluna **J**. A coluna **K** é `Motivo Canc.`.

Contagem validada pela planilha, considerando últimos 36 meses, número principal do orçamento sem o sufixo `-XX` e status `A`:

```txt
Itens nos últimos 36 meses: 6.774
Orçamentos únicos nos últimos 36 meses: 3.047
Orçamentos em aberto por status A: 116
```

O orçamento `014142` aparece na planilha com status `B`, pedido de venda `027474` e data de fechamento `29/05/2026`, portanto não deve entrar como aberto.

## Regra aplicada

A lista de Orçamentos em aberto agora usa esta regra:

1. Buscar todos os itens dos últimos 36 meses com status `A`, `B` e `C`.
2. Buscar em páginas de 1000 linhas para não perder registros do Supabase.
3. Agrupar por:

```txt
codigo_cliente_loja + numero_orcamento
```

4. Usar o número principal do orçamento, sem o item `-XX`.
5. Considerar aberto apenas quando o status final do grupo for `A`.

Prioridade de status em caso de mistura por algum registro antigo:

```txt
B = Fechado
C = Cancelado
A = Aberto
```

Assim, se um orçamento tiver algum registro final fechado ou cancelado, ele não entra como aberto.

## Arquivo alterado

Substituir inteiro:

```txt
hooks/useOrcamentosAbertos.ts
```

## Como aplicar

Copie o conteúdo deste pacote por cima da raiz do projeto.

Depois rode:

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

## Como testar

1. Abra o CRM.
2. Clique em Orçamentos em aberto.
3. Confirme se a contagem fica próxima do esperado pela planilha correta: `116`.
4. Pesquise pelo orçamento `014142` ou `14142`.
5. Ele não deve aparecer na lista de abertos.
6. Abra o histórico do cliente correspondente e confirme que o orçamento continua como fechado.

## Commit sugerido

```bash
git status
git add hooks/useOrcamentosAbertos.ts INSTRUCOES_ETAPA14R.md
git commit -m "Corrige contagem de orcamentos abertos com paginacao e status"
git push origin main
```

# Etapa 14Q — Corrigir contagem de orçamentos em aberto pelo status final

## Problema corrigido

A tela de **Orçamentos em aberto** podia contar um orçamento como aberto quando existia pelo menos um item com status `A`, mesmo que o orçamento principal já tivesse outro item fechado (`B`) ou possuísse pedido/data de fechamento.

Exemplo relatado:

- Orçamento `14142` aparece como **Fechado** no histórico.
- Mas ainda entrava na contagem de **Orçamentos em aberto**.

## Causa

A consulta anterior buscava diretamente no Supabase apenas linhas com:

```ts
.eq('status', 'A')
```

Isso funcionava para itens individuais, mas não para o orçamento principal agrupado.

Como o CRM mostra o histórico agrupado pelo número principal do orçamento, a tela de abertos também precisa calcular o **status final do orçamento agrupado**.

## Regra aplicada

Agora a tela de Orçamentos em aberto:

1. Busca status `A`, `B` e `C` dos últimos 36 meses.
2. Agrupa por `codigo_cliente_loja + numero_orcamento`.
3. Calcula o status final com prioridade:

```txt
B = Fechado
A = Aberto
C = Cancelado
```

4. Só considera aberto quando:

```txt
status final = A
E não existe pedido de venda
E não existe data de fechamento
```

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
2. Veja o alerta de orçamentos em aberto.
3. Clique para abrir a lista.
4. Confirme que o orçamento `14142` não aparece mais como aberto.
5. Confirme que a contagem esperada voltou para `176`.
6. Abra o histórico do cliente desse orçamento e confirme que ele continua aparecendo como fechado.

## Commit sugerido

```bash
git status
git add hooks/useOrcamentosAbertos.ts INSTRUCOES_ETAPA14Q.md
git commit -m "Corrige contagem de orcamentos abertos pelo status final"
git push origin main
```

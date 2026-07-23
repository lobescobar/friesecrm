# Etapa 14B — Ajuste do botão Solicitar cancelamento

## Objetivo

Remover o botão **Solicitar cancelamento** da primeira tela do Histórico do Cliente,
mantendo a ação somente dentro da tela/modal de detalhes do orçamento.

## Arquivo alterado

Substituir inteiro:

```txt
components/crm/HistoricoCliente.tsx
```

## Comportamento esperado

### Histórico do Cliente

A tabela principal deve exibir somente:

```txt
Orçamento
Data de emissão
Pedido de venda
Data de fechamento
Status
```

A coluna **Ação** foi removida.

### Detalhe do orçamento

O botão **Solicitar cancelamento** continua aparecendo no rodapé da tela/modal de detalhe,
mas somente para orçamento com status **Aberto**.

Para orçamentos **Fechado** ou **Cancelado**, o botão não deve aparecer.

## O que esta etapa não altera

```txt
Supabase
ERP
status do orçamento
importações
permissões
e-mail
regras de cancelamento
```

## Testes obrigatórios

Rode:

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

Depois teste:

1. Abrir um cliente.
2. Ir em Histórico.
3. Confirmar que não existe coluna Ação.
4. Confirmar que a lista principal não mostra o botão Solicitar cancelamento.
5. Clicar em um orçamento Aberto.
6. Confirmar que o botão aparece no detalhe.
7. Clicar em um orçamento Fechado.
8. Confirmar que o botão não aparece.
9. Clicar em um orçamento Cancelado.
10. Confirmar que o botão não aparece.

## Commit sugerido

```bash
git status
git add .
git commit -m "Move solicitacao de cancelamento para detalhe do orcamento"
git push origin main
```

# Etapa 9 — Ajustes visuais de login e alerta

## Arquivos para substituir inteiro

- `app/login/page.tsx`
- `components/crm/AlertaOrcamentosAbertos.tsx`

## Alterações aplicadas

1. Na tela de login, o link/botão `Esqueceu a senha?` foi movido para baixo do botão `Entrar`.
2. No alerta de orçamentos em aberto, foi removida a frase:
   `Clique para visualizar os clientes com orçamento aberto nos últimos 36 meses.`

A mensagem principal permanece:

`Existem X orçamentos em aberto.`

## Como aplicar

Copie as pastas `app` e `components` deste pacote por cima da raiz do projeto.

Confirme que está na branch:

```bash
git branch
```

O esperado:

```txt
* historico-cliente-orcamentos
```

Depois rode:

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

## Commit sugerido

```bash
git status
git add .
git commit -m "Ajusta login e mensagem de orçamentos em aberto"
git push
```

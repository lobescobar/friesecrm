# Etapa 14M — Filtros e ordenação em Orçamentos em aberto

## Arquivo alterado

Substituir inteiro:

`components/crm/AlertaOrcamentosAbertos.tsx`

## O que foi adicionado

Na tela/modal **Orçamentos em aberto**, foram adicionados:

- busca por cliente, código do cliente ou número do orçamento;
- ordenação por:
  - Data de emissão
  - Nº Orçamento
  - Nº Cliente
  - Nome
- direção:
  - Crescente
  - Decrescente
- botão Limpar;
- contador "Exibindo X de Y orçamento(s) em aberto";
- mensagem quando nenhum orçamento corresponder ao filtro.

## Testes obrigatórios

Rodar:

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

Depois testar:

1. Abrir o CRM.
2. Clicar em "Visualizar abertos".
3. Buscar por nome de cliente.
4. Buscar por número de orçamento.
5. Ordenar por Data de emissão.
6. Ordenar por Nº Cliente.
7. Ordenar por Nome.
8. Testar crescente e decrescente.
9. Clicar em "Abrir histórico".
10. Confirmar que abre o cliente na aba Histórico.

## Commit sugerido

```bash
git status
git add components/crm/AlertaOrcamentosAbertos.tsx INSTRUCOES_ETAPA14M.md
git commit -m "Adiciona filtros e ordenacao em orcamentos abertos"
git push origin main
```

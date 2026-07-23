# Etapa 14L — Corrige headers fixos na importação de orçamentos

## Problema corrigido

Após mudar o importador de orçamentos para usar colunas fixas, ainda restou uma chamada para uma variável antiga:

```ts
headersPlanilha
```

Essa variável não existe mais no fluxo de colunas fixas, causando o erro:

```txt
headersPlanilha is not defined
```

## Arquivo alterado

Substituir inteiro:

```txt
components/crm/ImportarOrcamentos.tsx
```

## O que mudou

O sistema agora define os headers exibidos na tela com uma lista fixa:

```txt
Numero It
Cliente
Loja
Descricao
Quantidade
Status
Pedido Venda
Fechamento
DT Emissao
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

Depois teste a importação com:

```txt
Orçamentos 24-06.xlsx
```

## Commit sugerido

```bash
git status
git add components/crm/ImportarOrcamentos.tsx
git commit -m "Corrige headers fixos na importacao de orcamentos"
git push origin main
```

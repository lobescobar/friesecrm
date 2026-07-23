# Etapa 13 — Ajuste do título do cabeçalho

## Objetivo

Alterar os dizeres do cabeçalho principal do CRM.

## Alteração solicitada

Substituir:

```txt
Mini CRM Mapa
Clientes, mapa, contatos e importação ERP
```

por:

```txt
Painel de Gestão Comercial
```

## Arquivo alterado

```txt
components/crm/CrmHeader.tsx
```

## O que não foi alterado

- Banco de dados
- Supabase
- Importações
- Permissões
- Histórico
- Modal do cliente
- Regras de status

## Como aplicar

Copiar o conteúdo deste pacote por cima da raiz do projeto.

Depois rodar:

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
git commit -m "Ajusta titulo do cabecalho para Painel de Gestao Comercial"
git push origin main
```

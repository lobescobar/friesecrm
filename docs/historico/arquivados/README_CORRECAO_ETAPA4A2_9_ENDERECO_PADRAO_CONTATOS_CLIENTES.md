# Etapa 4A.2.9 — Correção endereço padrão em contatos_clientes

## Objetivo

Corrigir o erro ao clicar em **Usar como padrão** na aba **Contatos** do modal do cliente.

Erro observado no navegador:

```text
PATCH /rest/v1/contatos_clientes?id=eq... 400 (Bad Request)
```

A causa provável é que o patch anterior tentava atualizar uma coluna chamada `principal`, mas a tabela real usada pelo CRM é `contatos_clientes` e precisa de uma coluna própria para o endereço padrão.

## Backup antes de aplicar

Crie o backup:

```text
backup-mini-crm-mapa-antes-etapa4A2-9-endereco-padrao-contatos-clientes
```

## Arquivos para substituir

Substitua estes arquivos inteiros:

```text
components/crm/ContatosCliente.tsx
components/crm/ClienteModal.tsx
types/index.ts
```

## SQL para rodar no Supabase

No Supabase:

```text
SQL Editor > New query
```

Cole e rode:

```sql
ALTER TABLE public.contatos_clientes
ADD COLUMN IF NOT EXISTS endereco_padrao boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.contatos_clientes.endereco_padrao IS
'Indica se este contato/endereço de visita é o endereço padrão do cliente no CRM.';
```

Também incluí este arquivo no patch:

```text
supabase/migrations/20260703_add_endereco_padrao_contatos_clientes.sql
```

## O que muda no código

O código passa a usar:

```text
endereco_padrao
```

em vez de:

```text
principal
```

## Testes

Depois de aplicar o SQL e substituir os arquivos:

```bash
npm run dev
```

Teste:

```text
Cliente > Contatos
Clicar em Usar como padrão
Confirmar se aparece o selo Padrão
Recarregar a página
Confirmar se o endereço padrão permanece marcado
```

Se passar, registre:

```text
backup-mini-crm-mapa-apos-etapa4A2-9-endereco-padrao-contatos-clientes-funcionando
```

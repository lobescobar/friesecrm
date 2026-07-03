# Etapa 1 — Segurança e banco

Arquivos preparados para aplicar a primeira etapa da revisão técnica.

## Antes de substituir

Mantenha o backup funcionando:

```text
backup-mini-crm-mapa-apos-publicacao-funcionando-2026-07-02
```

## Arquivos do projeto para substituir

```text
next.config.ts
utils/sessionCache.ts
hooks/useAuth.ts
app/crm/page.tsx
```

## Arquivos novos para adicionar

```text
supabase/migrations/007_orcamentos_interacoes.sql
supabase/migrations/008_contatos_endereco_visita.sql
supabase/checks/verificar_policies_crm.sql
```

## Ordem segura

1. Copie os arquivos para o projeto.
2. Execute no Supabase SQL Editor:

```text
supabase/migrations/007_orcamentos_interacoes.sql
supabase/migrations/008_contatos_endereco_visita.sql
```

3. Execute o check opcional:

```text
supabase/checks/verificar_policies_crm.sql
```

4. No terminal:

```bash
npm run build
npm run dev
```

5. Teste:
   - login e logout
   - abrir CRM após logout em computador compartilhado
   - contatos com endereço de visita
   - histórico manual do orçamento
   - aba Auditoria para confirmar registros novos

## Observação

O arquivo `next.config.ts` adiciona headers de segurança. Se alguma integração externa futura parar por CSP, ajustar `connect-src`, `img-src` ou `script-src` antes de publicar.

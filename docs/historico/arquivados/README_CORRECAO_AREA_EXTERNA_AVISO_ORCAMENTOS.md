# Correção — Área externa do aviso de orçamentos em aberto

## Arquivo alterado

- `app/crm/page.tsx`

## Ajuste aplicado

Na área de Orçamentos, o card externo que envolve o aviso de orçamentos em aberto foi reduzido proporcionalmente.

- Aviso interno: 58px
- Padding externo: 8px superior + 8px inferior
- Altura visual proporcional: aproximadamente 74px
- Padrão visual do `crm-card` preservado

## Como testar

```bash
npm run build
npm run dev
```

Depois acesse:

```text
/crm > Orçamentos
```

Confirme se a área branca externa do aviso ficou proporcional ao aviso azul interno.

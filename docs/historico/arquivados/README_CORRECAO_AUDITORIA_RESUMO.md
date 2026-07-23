# Correção — AuditoriaResumo sem descrições nos cards

## Arquivo alterado

- `components/crm/admin/AuditoriaResumo.tsx`

## Alterações

- Removidas as descrições visíveis abaixo dos números dos cards.
- Reduzida e padronizada a altura dos cards com `min-h-[96px]`.
- Mantido `aria-label` simples para acessibilidade: título + valor.
- Nenhuma regra de negócio foi alterada.

## Teste

```bash
npm run build
npm run dev
```

Depois abrir `/crm`, entrar em **Auditoria** e confirmar os cards.

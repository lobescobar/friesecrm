# Correção Etapa 4A.2.6 — Botões administrativos compactos com fonte 14px

## Objetivo

Padronizar os botões das telas administrativas que aparecem como:

- Cadastrar e-mail
- Criar usuário
- Editar

## Arquivos alterados

- `components/crm/admin/RegrasCancelamentoOrcamentos.tsx`
- `components/crm/GestaoUsuarios.tsx`

## Padrão aplicado

Os botões receberam o padrão compacto:

```tsx
size="sm"
className="h-[30px] min-h-[30px] px-[10px] py-0 text-sm leading-none"
```

## Resultado visual esperado

- Fonte de 14px (`text-sm`)
- Altura visual de 30px
- Padding horizontal de 10px
- Largura automática, proporcional ao texto
- Sem largura fixa
- Sem alteração de regra de negócio

## Validação

Foram executados com sucesso:

```bash
npm run typecheck
npm run lint
```

## Observação

Não foi alterado banco, Supabase, regra de negócio ou permissões.

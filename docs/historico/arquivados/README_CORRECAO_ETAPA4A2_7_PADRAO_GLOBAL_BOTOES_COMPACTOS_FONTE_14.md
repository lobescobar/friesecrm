# Correção Etapa 4A.2.7 — padrão global de botões compactos

## Objetivo
Padronizar todos os botões que usam `components/ui/Button.tsx` com o mesmo padrão visual compacto:

- Fonte: 14px (`text-sm`)
- Altura visual: 30px
- Padding horizontal: 10px
- Padding vertical: 0
- Largura automática, proporcional ao texto
- Texto sem quebra de linha (`whitespace-nowrap`)

## Arquivo alterado
Substituir o arquivo inteiro:

```text
components/ui/Button.tsx
```

## Regra aplicada
Os tamanhos `sm`, `md` e `lg` passam a usar o mesmo padrão compacto:

```tsx
const compactButtonClasses =
  "h-[30px] min-h-[30px] px-[10px] py-0 text-sm leading-none whitespace-nowrap";

const sizeClasses = {
  sm: compactButtonClasses,
  md: compactButtonClasses,
  lg: compactButtonClasses,
};
```

## Observação técnica
A largura não foi fixada. O botão fica proporcional ao texto:
- `Sair` fica menor.
- `Editar` fica médio.
- `Importar Orçamentos` fica maior, mas com a mesma altura e fonte.

## Validação recomendada
Depois de aplicar:

```bash
npm run build
npm run dev
```

Testar:
- Cabeçalho: Importar ERP, Importar Orçamentos, Sair
- Orçamentos: Visualizar abertos
- Clientes: Limpar filtros
- Administração: Criar usuário, Cadastrar e-mail, Editar
- Modal cliente: Histórico, Fechar, Salvar alterações

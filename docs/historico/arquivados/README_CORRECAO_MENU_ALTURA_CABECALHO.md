# Correção — altura do menu principal

Arquivo alterado:

- `components/crm/pagina/NavegacaoAreasCRM.tsx`

## Ajuste aplicado

- A área externa do menu recebeu altura mínima desktop de `110px`, aproximando ao cabeçalho superior.
- O conteúdo interno foi centralizado verticalmente.
- Os cards internos mantêm o padrão visual atual.
- Em telas menores, o menu continua responsivo e pode crescer conforme as linhas da grade.

## Teste

```bash
npm run build
npm run dev
```

Abrir `/crm` e conferir o cabeçalho superior e o menu principal.

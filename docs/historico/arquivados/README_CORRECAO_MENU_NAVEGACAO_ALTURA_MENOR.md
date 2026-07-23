# Correção — Menus de navegação com altura menor

Arquivo alterado:

- `components/crm/pagina/NavegacaoAreasCRM.tsx`

Ajustes aplicados:

- Mantida a área externa do menu com `90px`.
- Reduzida a altura dos botões internos para `58px`.
- Reduzido o padding vertical dos botões.
- Mantido o padrão visual: fundo branco, borda, sombra do card externo, estado ativo com borda âmbar e fundo claro.
- Responsivo preservado.

Depois de substituir, rode:

```bash
npm run build
npm run dev
```

Teste em:

```text
/crm
```

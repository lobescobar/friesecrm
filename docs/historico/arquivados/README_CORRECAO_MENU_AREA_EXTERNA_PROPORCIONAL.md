# Correção — Menu com área externa proporcional

Arquivo alterado:

```text
components/crm/pagina/NavegacaoAreasCRM.tsx
```

Ajuste aplicado:

- Botões internos mantidos com `h-[58px]`.
- Área externa ajustada para `md:h-[74px]`.
- A altura externa ficou proporcional ao conteúdo: 58px do botão + 8px de padding superior + 8px de padding inferior.
- Padrão visual preservado.
- Responsivo preservado.

Depois de substituir, rode:

```bash
npm run build
npm run dev
```

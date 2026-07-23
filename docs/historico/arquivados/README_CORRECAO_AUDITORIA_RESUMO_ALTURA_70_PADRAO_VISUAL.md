# Correção — AuditoriaResumo altura 70px mantendo padrão visual

Arquivo alterado:

- components/crm/admin/AuditoriaResumo.tsx

Ajuste:

- Cards com altura fixa de 70px.
- Mantido o padrão visual: fundo branco, borda cinza, sombra suave e cantos arredondados.
- Mantido apenas título + número.
- Conteúdo centralizado verticalmente.
- Nenhuma regra de negócio alterada.

Teste:

```bash
npm run build
npm run dev
```

Depois acesse:

```text
/crm > Auditoria
```

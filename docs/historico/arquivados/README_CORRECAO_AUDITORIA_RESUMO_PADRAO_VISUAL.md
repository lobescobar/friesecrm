# Correção — AuditoriaResumo com padrão visual mantido

Arquivo alterado:

- components/crm/admin/AuditoriaResumo.tsx

Ajuste:

- Remove as descrições abaixo dos cards.
- Mantém o padrão visual original dos cards: borda, fundo branco, sombra, padding e cantos arredondados.
- Usa altura mínima controlada, sem forçar card achatado.
- Mantém acessibilidade com aria-label contendo título e valor.

Teste:

```bash
npm run build
npm run dev
```

Depois acesse:

```text
/crm > Auditoria
```

# Correção — Aviso de orçamentos em aberto com altura reduzida

Arquivo alterado:

```text
components/crm/AlertaOrcamentosAbertos.tsx
```

Ajuste aplicado:

```text
- Aviso "Existem X orçamentos em aberto" reduzido para 58px no desktop
- Área interna proporcional
- Botão "Visualizar/Ocultar abertos" reduzido proporcionalmente
- Padrão visual azul preservado
- Responsivo preservado em telas menores
```

Após substituir, rode:

```bash
npm run build
npm run dev
```

Teste em:

```text
/crm > Orçamentos
```

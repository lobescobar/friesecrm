# Correção Etapa 4A.2.5 — Botão Histórico compacto

## Objetivo

Reduzir a área visual do botão **Histórico** na tabela de histórico, mantendo a fonte em 14px.

## Arquivo alterado

- `components/crm/historico/TabelaHistoricoOrcamentos.tsx`

## Ajuste aplicado

O botão **Histórico** passou a usar:

```tsx
className="h-[30px] min-h-[30px] px-[10px] py-0 text-sm leading-none"
```

## Observação técnica

Foi aplicado:
- altura fixa de 30px;
- padding horizontal de 10px;
- padding vertical zerado;
- fonte mantida em 14px (`text-sm`);
- `leading-none` para centralizar melhor o texto.

Não foi usada largura fixa de 30px porque a palavra **Histórico** não cabe legível em 30px com fonte 14px.

## Validação recomendada

Após substituir o arquivo, rodar:

```bash
npm run dev
```

Conferir:

- CRM > Cliente > aba Histórico;
- botão Histórico menor;
- fonte ainda em 14px;
- clique abrindo o histórico normalmente.

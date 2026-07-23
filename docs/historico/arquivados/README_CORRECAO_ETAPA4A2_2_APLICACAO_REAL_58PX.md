# Correção Etapa 4A.2.2 — aplicação real dos cards 58px e botões compactos

Esta correção substitui o patch anterior da Etapa 4A.2.1, que não alterou os arquivos de tela como esperado.

## Arquivos alterados

- components/crm/historico/HistoricoResumoCards.tsx
- components/crm/historico/TabelaHistoricoOrcamentos.tsx
- components/crm/ClienteModal.tsx
- components/ui/Modal.tsx

## Ajustes visuais

1. Cards Total / Abertos / Fechados / Cancelados:
   - altura fixa: h-[58px]
   - padding reduzido: px-4 py-2
   - número reduzido para text-xl
   - foco acessível com destaque dourado Friese

2. Botão Histórico na tabela:
   - variant="primary"
   - size="sm"

3. Botões Fechar e Salvar alterações:
   - size="sm"
   - Salvar usa loading/loadingText

4. Rodapé do modal:
   - padding vertical reduzido de py-4 para py-3

## Como validar que aplicou

No arquivo components/crm/historico/HistoricoResumoCards.tsx procure:

```tsx
h-[58px]
```

No arquivo components/crm/historico/TabelaHistoricoOrcamentos.tsx procure:

```tsx
variant="primary"
size="sm"
```

No arquivo components/crm/ClienteModal.tsx procure:

```tsx
loading={salvando}
loadingText="Salvando..."
```

## Comandos recomendados

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

## Observação

Não altera banco, Supabase, regra de negócio, rotas ou importação.

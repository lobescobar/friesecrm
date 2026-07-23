# Etapa 4A — Padronização visual base

Esta etapa não muda regra de negócio. Ela prepara a base visual para as próximas padronizações do CRM.

## Arquivos incluídos

- `components/ui/Button.tsx`
- `components/ui/EmptyState.tsx`
- `components/ui/LoadingSpinner.tsx`
- `components/ui/StatusMessage.tsx`
- `components/ui/SectionCard.tsx`
- `app/globals.css`

## O que foi ajustado

- `Button` recebeu padrão de tamanhos, `fullWidth`, ícones opcionais e loading visual padronizado.
- `EmptyState` recebeu variantes visuais, ícone configurável, modo compacto e role acessível.
- `LoadingSpinner` recebeu tamanhos, superfície opcional e spinner visual consistente.
- `StatusMessage` foi criado para padronizar mensagens de erro, sucesso, aviso e informação.
- `SectionCard` foi criado para padronizar cards de seção com título, subtítulo e ações.
- `globals.css` recebeu classes utilitárias visuais reutilizáveis do CRM.

## Antes de aplicar

Preserve o backup:

`backup-mini-crm-mapa-apos-etapa3d-refatoracao-page-crm-funcionando`

## Depois de copiar os arquivos

Execute:

```bash
npm run build
npm run dev
```

## Teste obrigatório

1. Abrir `/crm`.
2. Conferir carregamento inicial.
3. Abrir Clientes, Orçamentos, Mapa, Administração e Auditoria.
4. Abrir um modal de cliente.
5. Conferir botões principais e secundários.
6. Confirmar que clique fora do modal não fecha.
7. Confirmar que Escape e X continuam fechando.
8. Conferir telas vazias, mensagens e carregamentos.

## Observação

Os novos componentes `StatusMessage` e `SectionCard` foram adicionados para uso gradual nas próximas etapas. Nesta etapa, eles não alteram regras do CRM.

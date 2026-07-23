# Etapa 4A.2.8 — Remover Mapa das informações do cliente e selecionar endereço padrão

## Objetivo

Correção segura no modal de cliente:

- Remove a aba **Mapa** das informações internas do cliente.
- Remove o conteúdo e o botão de localização interna do modal.
- Mantém a área principal **Mapa** do CRM intacta.
- Adiciona seleção de **endereço padrão de visita** na aba **Contatos**.
- Usa o campo existente `principal` dos contatos para marcar qual contato/endereço será o padrão.

## Arquivos alterados

- `components/crm/ClienteModal.tsx`
- `components/crm/ContatosCliente.tsx`
- `components/crm/cliente-modal/ClienteDados.tsx`
- `components/crm/cliente-modal/ClienteModalNav.tsx`
- `components/crm/cliente-modal/ClienteResumo.tsx`
- `utils/crmNavegacao.ts`

## Como funciona o endereço padrão

Na aba **Contatos**, cada contato com `endereco_visita` mostra:

- selo **Padrão**, quando já é o endereço padrão;
- botão **Usar como padrão**, quando ainda não é o padrão.

Ao marcar um endereço como padrão:

1. contatos anteriores marcados como `principal` são desmarcados;
2. o contato selecionado recebe `principal: true`.

## Backup recomendado

Antes de aplicar:

`backup-mini-crm-mapa-antes-etapa4A2-8-remover-mapa-cliente-endereco-padrao`

Depois de testar funcionando:

`backup-mini-crm-mapa-apos-etapa4A2-8-remover-mapa-cliente-endereco-padrao-funcionando`

## Validação local

Executado nesta preparação:

- `npm run typecheck`
- `npm run lint`

Não altera tabelas, não cria migration, não faz deploy e não remove a área principal Mapa do CRM.

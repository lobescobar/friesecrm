# Etapa 14Y-B - Ajustes da administração

Arquivos:
- components/crm/admin/RegrasCancelamentoOrcamentos.tsx
- components/crm/GestaoUsuarios.tsx
- app/api/admin/delete-user/route.ts

Alterações:
- remove descrições longas da seção de e-mails de cancelamento;
- muda os e-mails de cancelamento para tabela/lista com dinâmica semelhante à Gestão de Usuários;
- edição de e-mail abre em modal;
- edição de usuário abre em modal;
- adiciona exclusão de cadastro de e-mail;
- adiciona exclusão segura de usuário por API server-side.

Validar:
npm run lint
npm run typecheck
npm run build

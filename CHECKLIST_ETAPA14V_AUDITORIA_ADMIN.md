# CHECKLIST ETAPA 14V — TELA ADMINISTRATIVA DE AUDITORIA

Data: 2026-06-26
Projeto: Mini CRM Mapa / CRM Friese

## Objetivo
Criar uma área administrativa para consultar a tabela public.audit_log criada na Etapa 14U.

## Arquivos criados
- hooks/useAuditoria.ts
- components/crm/admin/AuditoriaAdmin.tsx
- components/crm/admin/AuditoriaResumo.tsx
- components/crm/admin/AuditoriaFiltros.tsx
- components/crm/admin/AuditoriaTabela.tsx
- components/crm/admin/AuditoriaDetalhes.tsx

## Arquivo alterado
- app/crm/page.tsx

## O que a tela faz
- Exibe seção "Auditoria do CRM" somente para administradores.
- Carrega eventos da tabela audit_log sob demanda, quando o admin abre a seção.
- Permite filtro por data inicial, data final, usuário, tabela, ação, origem, busca geral e limite.
- Mostra cards de resumo.
- Mostra tabela de eventos.
- Mostra detalhe técnico do evento selecionado.
- Mantém auditoria somente leitura.

## Segurança
- Nenhuma chave foi incluída no pacote.
- A tela usa RLS já existente: audit_log_select_admin.
- O frontend apenas lê audit_log.
- Não há insert/update/delete de audit_log no frontend.

## Validação feita neste pacote
- npm run typecheck: OK
- eslint via node node_modules/eslint/bin/eslint.js: OK
- npm run build: não validado neste ambiente porque o Next tentou baixar o pacote nativo Linux SWC e o ambiente bloqueou registry. Rodar localmente.

## Comandos para validar localmente
npm run lint
npm run typecheck
npm run build
npm run dev

## Testes funcionais
1. Entrar como admin.
2. Abrir /crm.
3. Abrir a seção "Auditoria do CRM".
4. Validar que eventos aparecem.
5. Testar filtros.
6. Selecionar um evento e ver detalhes.
7. Entrar como vendedor e confirmar que a seção não aparece.

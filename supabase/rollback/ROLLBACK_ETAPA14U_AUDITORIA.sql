-- Rollback Etapa 14U - Auditoria do CRM
-- Use somente se for necessário remover a auditoria criada na Etapa 14U.

begin;

drop trigger if exists trg_audit_contatos_clientes on public.contatos_clientes;
drop trigger if exists trg_audit_clientes_observacoes on public.clientes;

drop function if exists public.crm_registrar_auditoria_importacao(text, text, text, jsonb);
drop function if exists public.crm_audit_clientes_observacoes();
drop function if exists public.crm_audit_contatos_clientes();
drop function if exists public.crm_audit_registrar(text, text, uuid, text, jsonb, jsonb, jsonb, text);

drop table if exists public.audit_log;

commit;

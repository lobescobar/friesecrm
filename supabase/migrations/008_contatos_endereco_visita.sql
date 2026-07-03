-- Etapa 1 - Endereço de visita por contato
-- CRM Friese / Mini CRM Mapa
--
-- OBJETIVO
-- Registrar oficialmente o campo manual endereco_visita em contatos_clientes.
--
-- IMPORTANTE
-- Este campo pertence ao contato, não ao cliente.
-- Não remove eventual coluna endereco_visita criada anteriormente em public.clientes,
-- para evitar ação destrutiva em produção.

begin;

alter table public.contatos_clientes
add column if not exists endereco_visita text null;

comment on column public.contatos_clientes.endereco_visita is
  'Endereço de visita específico do contato. Campo manual do CRM.';

-- As policies e triggers de auditoria já existentes em contatos_clientes continuam válidos,
-- porque usam cliente_id e auditam a linha completa.

commit;

-- Conferência:
-- select column_name, data_type, is_nullable
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name = 'contatos_clientes'
--   and column_name = 'endereco_visita';

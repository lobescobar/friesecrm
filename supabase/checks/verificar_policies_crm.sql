-- Conferência de segurança do CRM
-- Execute somente para leitura/verificação.

-- 1) Tabelas principais com RLS
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'clientes',
    'contatos_clientes',
    'orcamentos_historico',
    'orcamentos_interacoes',
    'profiles',
    'audit_log',
    'emails_cancelamento_orcamentos',
    'regras_cancelamento_segmentos'
  )
order by tablename;

-- 2) Policies principais
select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'clientes',
    'contatos_clientes',
    'orcamentos_historico',
    'orcamentos_interacoes',
    'profiles',
    'audit_log',
    'emails_cancelamento_orcamentos',
    'regras_cancelamento_segmentos'
  )
order by tablename, policyname;

-- 3) Grants da tabela orcamentos_interacoes
select
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'orcamentos_interacoes'
order by grantee, privilege_type;

-- 4) Triggers relevantes
select
  event_object_table,
  trigger_name,
  event_manipulation,
  action_timing
from information_schema.triggers
where trigger_schema = 'public'
  and event_object_table in (
    'clientes',
    'contatos_clientes',
    'orcamentos_interacoes'
  )
order by event_object_table, trigger_name, event_manipulation;

-- 5) Coluna endereco_visita no lugar correto
select
  table_name,
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'contatos_clientes' and column_name = 'endereco_visita')
    or (table_name = 'clientes' and column_name = 'endereco_visita')
  )
order by table_name;

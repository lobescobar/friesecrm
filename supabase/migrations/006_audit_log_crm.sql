-- Etapa 14U - Auditoria do CRM
-- CRM Friese / Mini CRM Mapa
--
-- OBJETIVO
-- 1. Criar tabela public.audit_log para registrar alterações relevantes.
-- 2. Auditar automaticamente contatos_clientes: insert, update e delete.
-- 3. Auditar automaticamente alterações de observacoes em clientes.
-- 4. Permitir que importações registrem um evento resumido de auditoria.
-- 5. Preparar estrutura genérica para futuras interações comerciais.
--
-- IMPORTANTE
-- Execute depois da Etapa 14S, pois este script usa public.is_admin().
-- Faça backup do banco antes de executar em produção.

begin;

-- -----------------------------------------------------------------------------
-- 1) Tabela central de auditoria
-- -----------------------------------------------------------------------------

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),

  created_at timestamptz not null default now(),

  -- Quem executou a alteração. Em execuções administrativas via SQL direto,
  -- auth.uid() pode ser nulo.
  user_id uuid null,
  user_email text null,

  -- Onde a alteração ocorreu.
  tabela text not null,
  registro_id text null,
  cliente_id uuid null,

  -- O que aconteceu.
  acao text not null,
  origem text not null default 'crm',

  -- Estado anterior e novo. Para importações resumidas, ficam nulos e o resumo
  -- fica em detalhes.
  valor_anterior jsonb null,
  valor_novo jsonb null,

  -- Campo livre para resumos, nome de arquivo, totais, origem futura etc.
  detalhes jsonb not null default '{}'::jsonb
);

comment on table public.audit_log is
  'Registro de auditoria do CRM: usuário, data, tabela, cliente, ação, valores e detalhes.';
comment on column public.audit_log.tabela is
  'Tabela ou entidade auditada. Ex.: clientes, contatos_clientes, orcamentos_historico.';
comment on column public.audit_log.registro_id is
  'ID do registro alterado, como texto para permitir entidades futuras sem UUID.';
comment on column public.audit_log.cliente_id is
  'ID do cliente relacionado à alteração, quando aplicável.';
comment on column public.audit_log.acao is
  'Ação executada. Ex.: insert, update, delete, update_observacoes, importacao_erp.';
comment on column public.audit_log.detalhes is
  'Metadados adicionais, como nome de arquivo e resumo de importação.';

create index if not exists idx_audit_log_created_at
on public.audit_log (created_at desc);

create index if not exists idx_audit_log_user_id
on public.audit_log (user_id);

create index if not exists idx_audit_log_tabela
on public.audit_log (tabela);

create index if not exists idx_audit_log_cliente_id
on public.audit_log (cliente_id);

create index if not exists idx_audit_log_acao
on public.audit_log (acao);

alter table public.audit_log enable row level security;

-- -----------------------------------------------------------------------------
-- 2) Segurança da auditoria
-- -----------------------------------------------------------------------------
-- Regra: auditoria é somente leitura para admin.
-- Ninguém deve alterar ou excluir logs pelo frontend.
-- Inserções são feitas por triggers/funções SECURITY DEFINER.

DROP POLICY IF EXISTS "audit_log_select_admin" ON public.audit_log;
DROP POLICY IF EXISTS "audit_log_insert_bloqueado" ON public.audit_log;
DROP POLICY IF EXISTS "audit_log_update_bloqueado" ON public.audit_log;
DROP POLICY IF EXISTS "audit_log_delete_bloqueado" ON public.audit_log;

create policy "audit_log_select_admin"
on public.audit_log
for select
to authenticated
using (
  public.is_admin(auth.uid())
);

revoke all on public.audit_log from anon;
revoke all on public.audit_log from authenticated;
grant select on public.audit_log to authenticated;

-- -----------------------------------------------------------------------------
-- 3) Função interna para gravar auditoria
-- -----------------------------------------------------------------------------

create or replace function public.crm_audit_registrar(
  p_tabela text,
  p_registro_id text,
  p_cliente_id uuid,
  p_acao text,
  p_valor_anterior jsonb default null,
  p_valor_novo jsonb default null,
  p_detalhes jsonb default '{}'::jsonb,
  p_origem text default 'crm'
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_user_id uuid;
  v_user_email text;
  v_audit_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is not null then
    select p.email
      into v_user_email
      from public.profiles p
     where p.id = v_user_id;
  end if;

  insert into public.audit_log (
    user_id,
    user_email,
    tabela,
    registro_id,
    cliente_id,
    acao,
    origem,
    valor_anterior,
    valor_novo,
    detalhes
  ) values (
    v_user_id,
    v_user_email,
    p_tabela,
    p_registro_id,
    p_cliente_id,
    p_acao,
    coalesce(nullif(trim(p_origem), ''), 'crm'),
    p_valor_anterior,
    p_valor_novo,
    coalesce(p_detalhes, '{}'::jsonb)
  ) returning id into v_audit_id;

  return v_audit_id;
end;
$$;

revoke all on function public.crm_audit_registrar(
  text,
  text,
  uuid,
  text,
  jsonb,
  jsonb,
  jsonb,
  text
) from public;

-- -----------------------------------------------------------------------------
-- 4) Auditoria automática de contatos_clientes
-- -----------------------------------------------------------------------------

create or replace function public.crm_audit_contatos_clientes()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if TG_OP = 'INSERT' then
    perform public.crm_audit_registrar(
      'contatos_clientes',
      new.id::text,
      new.cliente_id,
      'insert',
      null,
      to_jsonb(new),
      jsonb_build_object('operacao', TG_OP),
      'trigger'
    );

    return new;
  end if;

  if TG_OP = 'UPDATE' then
    if to_jsonb(new) is distinct from to_jsonb(old) then
      perform public.crm_audit_registrar(
        'contatos_clientes',
        new.id::text,
        new.cliente_id,
        'update',
        to_jsonb(old),
        to_jsonb(new),
        jsonb_build_object('operacao', TG_OP),
        'trigger'
      );
    end if;

    return new;
  end if;

  if TG_OP = 'DELETE' then
    perform public.crm_audit_registrar(
      'contatos_clientes',
      old.id::text,
      old.cliente_id,
      'delete',
      to_jsonb(old),
      null,
      jsonb_build_object('operacao', TG_OP),
      'trigger'
    );

    return old;
  end if;

  return null;
end;
$$;

revoke all on function public.crm_audit_contatos_clientes() from public;

drop trigger if exists trg_audit_contatos_clientes on public.contatos_clientes;

create trigger trg_audit_contatos_clientes
after insert or update or delete on public.contatos_clientes
for each row
execute function public.crm_audit_contatos_clientes();

-- -----------------------------------------------------------------------------
-- 5) Auditoria automática de observações em clientes
-- -----------------------------------------------------------------------------
-- A Etapa 14S já bloqueia dados ERP para vendedor comum.
-- Aqui auditamos somente a mudança do campo observacoes.

create or replace function public.crm_audit_clientes_observacoes()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  perform public.crm_audit_registrar(
    'clientes',
    new.id::text,
    new.id,
    'update_observacoes',
    jsonb_build_object('observacoes', old.observacoes),
    jsonb_build_object('observacoes', new.observacoes),
    jsonb_build_object('operacao', TG_OP, 'campo', 'observacoes'),
    'trigger'
  );

  return new;
end;
$$;

revoke all on function public.crm_audit_clientes_observacoes() from public;

drop trigger if exists trg_audit_clientes_observacoes on public.clientes;

create trigger trg_audit_clientes_observacoes
after update of observacoes on public.clientes
for each row
when (old.observacoes is distinct from new.observacoes)
execute function public.crm_audit_clientes_observacoes();

-- -----------------------------------------------------------------------------
-- 6) Função segura para registrar importações resumidas
-- -----------------------------------------------------------------------------
-- Usada pelo frontend após uma importação bem-sucedida.
-- Apenas admin pode registrar eventos de importação.

create or replace function public.crm_registrar_auditoria_importacao(
  p_tabela text,
  p_acao text,
  p_arquivo_nome text,
  p_resultado jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_detalhes jsonb;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if not public.is_admin(auth.uid()) then
    raise exception 'Apenas administradores podem registrar auditoria de importação.';
  end if;

  if coalesce(p_tabela, '') not in ('clientes', 'orcamentos_historico') then
    raise exception 'Tabela de importação não permitida para auditoria: %', p_tabela;
  end if;

  if coalesce(p_acao, '') not in ('importacao_erp', 'importacao_orcamentos') then
    raise exception 'Ação de importação não permitida para auditoria: %', p_acao;
  end if;

  v_detalhes := jsonb_build_object(
    'arquivo_nome', nullif(trim(coalesce(p_arquivo_nome, '')), ''),
    'resultado', coalesce(p_resultado, '{}'::jsonb)
  );

  return public.crm_audit_registrar(
    p_tabela,
    null,
    null,
    p_acao,
    null,
    null,
    v_detalhes,
    'importacao'
  );
end;
$$;

revoke all on function public.crm_registrar_auditoria_importacao(
  text,
  text,
  text,
  jsonb
) from public;

grant execute on function public.crm_registrar_auditoria_importacao(
  text,
  text,
  text,
  jsonb
) to authenticated;

commit;

-- -----------------------------------------------------------------------------
-- CONSULTAS DE CONFERÊNCIA APÓS EXECUTAR
-- -----------------------------------------------------------------------------
-- 1) Conferir tabela e RLS:
-- select schemaname, tablename, rowsecurity
-- from pg_tables
-- where schemaname = 'public'
--   and tablename = 'audit_log';
--
-- 2) Conferir policies:
-- select schemaname, tablename, policyname, cmd, roles, qual, with_check
-- from pg_policies
-- where schemaname = 'public'
--   and tablename = 'audit_log'
-- order by policyname;
--
-- 3) Conferir triggers:
-- select event_object_table, trigger_name, event_manipulation
-- from information_schema.triggers
-- where trigger_schema = 'public'
--   and event_object_table in ('clientes', 'contatos_clientes')
-- order by event_object_table, trigger_name, event_manipulation;
--
-- 4) Ver últimos logs:
-- select created_at, user_email, tabela, registro_id, cliente_id, acao, origem, detalhes
-- from public.audit_log
-- order by created_at desc
-- limit 50;

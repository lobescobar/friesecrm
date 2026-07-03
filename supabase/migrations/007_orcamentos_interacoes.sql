-- Etapa 1 - Segurança e banco
-- CRM Friese / Mini CRM Mapa
--
-- OBJETIVO
-- 1. Registrar oficialmente a tabela de histórico manual por orçamento.
-- 2. Substituir policies amplas por RLS usando alçada do cliente.
-- 3. Permitir leitura/inclusão de interações apenas para clientes dentro da alçada.
-- 4. Auditar insert/update/delete em public.orcamentos_interacoes.
--
-- IMPORTANTE
-- Execute depois das migrations:
-- - 005_seguranca_rls_policies_alcada.sql
-- - 006_audit_log_crm.sql
--
-- Este script é idempotente e não apaga dados existentes.

begin;

create table if not exists public.orcamentos_interacoes (
  id uuid primary key default gen_random_uuid(),

  cliente_id uuid not null references public.clientes(id) on delete cascade,
  numero_orcamento text not null,
  pedido_venda text null,

  -- Campos mantidos para compatibilidade com versões anteriores da tela.
  -- A interface atual usa apenas observacao, proximo_passo e data_retorno.
  status_comercial text null,
  responsavel_email text null,

  observacao text not null,
  proximo_passo text null,
  data_retorno date null,

  criado_por uuid null,
  criado_por_email text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orcamentos_interacoes
add column if not exists pedido_venda text null;

alter table public.orcamentos_interacoes
add column if not exists status_comercial text null;

alter table public.orcamentos_interacoes
add column if not exists responsavel_email text null;

alter table public.orcamentos_interacoes
add column if not exists proximo_passo text null;

alter table public.orcamentos_interacoes
add column if not exists data_retorno date null;

alter table public.orcamentos_interacoes
add column if not exists criado_por uuid null;

alter table public.orcamentos_interacoes
add column if not exists criado_por_email text null;

alter table public.orcamentos_interacoes
add column if not exists created_at timestamptz not null default now();

alter table public.orcamentos_interacoes
add column if not exists updated_at timestamptz not null default now();

comment on table public.orcamentos_interacoes is
  'Histórico manual e ações necessárias cadastradas no CRM para cada orçamento.';
comment on column public.orcamentos_interacoes.observacao is
  'Observação manual do usuário sobre o orçamento.';
comment on column public.orcamentos_interacoes.proximo_passo is
  'Ação necessária informada na interface do CRM.';
comment on column public.orcamentos_interacoes.data_retorno is
  'Lembrete informado na interface do CRM.';

create index if not exists idx_orcamentos_interacoes_cliente_id
on public.orcamentos_interacoes (cliente_id);

create index if not exists idx_orcamentos_interacoes_cliente_numero
on public.orcamentos_interacoes (cliente_id, numero_orcamento);

create index if not exists idx_orcamentos_interacoes_created_at
on public.orcamentos_interacoes (created_at desc);

create index if not exists idx_orcamentos_interacoes_data_retorno
on public.orcamentos_interacoes (data_retorno);

alter table public.orcamentos_interacoes enable row level security;

-- -----------------------------------------------------------------------------
-- Atualização automática de updated_at
-- -----------------------------------------------------------------------------

create or replace function public.crm_touch_updated_at()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.crm_touch_updated_at() from public;

drop trigger if exists trg_orcamentos_interacoes_updated_at
on public.orcamentos_interacoes;

create trigger trg_orcamentos_interacoes_updated_at
before update on public.orcamentos_interacoes
for each row
execute function public.crm_touch_updated_at();

-- -----------------------------------------------------------------------------
-- Proteção do autor do registro
-- -----------------------------------------------------------------------------

create or replace function public.crm_proteger_autor_orcamento_interacao()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select p.email
    into v_email
    from public.profiles p
   where p.id = auth.uid();

  if TG_OP = 'INSERT' then
    if new.criado_por is not null
       and new.criado_por is distinct from auth.uid()
       and not public.is_admin(auth.uid()) then
      raise exception 'Não é permitido informar outro usuário como criador do histórico.';
    end if;

    new.criado_por := coalesce(new.criado_por, auth.uid());
    new.criado_por_email := coalesce(new.criado_por_email, v_email);
    return new;
  end if;

  if TG_OP = 'UPDATE' then
    if not public.is_admin(auth.uid()) then
      new.criado_por := old.criado_por;
      new.criado_por_email := old.criado_por_email;
    end if;

    return new;
  end if;

  return new;
end;
$$;

revoke all on function public.crm_proteger_autor_orcamento_interacao() from public;

drop trigger if exists trg_proteger_autor_orcamento_interacao
on public.orcamentos_interacoes;

create trigger trg_proteger_autor_orcamento_interacao
before insert or update on public.orcamentos_interacoes
for each row
execute function public.crm_proteger_autor_orcamento_interacao();

-- -----------------------------------------------------------------------------
-- Remover policies antigas ou amplas
-- -----------------------------------------------------------------------------

drop policy if exists "Usuários autenticados podem ler interações de orçamentos"
on public.orcamentos_interacoes;

drop policy if exists "Usuários autenticados podem inserir interações de orçamentos"
on public.orcamentos_interacoes;

drop policy if exists "Usuários autenticados podem atualizar interações de orçamentos"
on public.orcamentos_interacoes;

drop policy if exists "orcamentos_interacoes_select_alcada"
on public.orcamentos_interacoes;

drop policy if exists "orcamentos_interacoes_insert_alcada"
on public.orcamentos_interacoes;

drop policy if exists "orcamentos_interacoes_update_autor_ou_admin"
on public.orcamentos_interacoes;

drop policy if exists "orcamentos_interacoes_delete_admin"
on public.orcamentos_interacoes;

-- -----------------------------------------------------------------------------
-- Novas policies por alçada
-- -----------------------------------------------------------------------------

create policy "orcamentos_interacoes_select_alcada"
on public.orcamentos_interacoes
for select
to authenticated
using (
  public.crm_cliente_id_dentro_alcada(cliente_id)
);

create policy "orcamentos_interacoes_insert_alcada"
on public.orcamentos_interacoes
for insert
to authenticated
with check (
  public.crm_cliente_id_dentro_alcada(cliente_id)
  and (
    criado_por is null
    or criado_por = auth.uid()
    or public.is_admin(auth.uid())
  )
);

create policy "orcamentos_interacoes_update_autor_ou_admin"
on public.orcamentos_interacoes
for update
to authenticated
using (
  public.crm_cliente_id_dentro_alcada(cliente_id)
  and (
    criado_por = auth.uid()
    or public.is_admin(auth.uid())
  )
)
with check (
  public.crm_cliente_id_dentro_alcada(cliente_id)
  and (
    criado_por = auth.uid()
    or public.is_admin(auth.uid())
  )
);

create policy "orcamentos_interacoes_delete_admin"
on public.orcamentos_interacoes
for delete
to authenticated
using (
  public.is_admin(auth.uid())
);

revoke all on public.orcamentos_interacoes from anon;
revoke all on public.orcamentos_interacoes from authenticated;

grant select, insert, update on public.orcamentos_interacoes to authenticated;

-- -----------------------------------------------------------------------------
-- Auditoria automática
-- -----------------------------------------------------------------------------

create or replace function public.crm_audit_orcamentos_interacoes()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if TG_OP = 'INSERT' then
    perform public.crm_audit_registrar(
      'orcamentos_interacoes',
      new.id::text,
      new.cliente_id,
      'insert',
      null,
      to_jsonb(new),
      jsonb_build_object(
        'operacao', TG_OP,
        'numero_orcamento', new.numero_orcamento
      ),
      'trigger'
    );

    return new;
  end if;

  if TG_OP = 'UPDATE' then
    if to_jsonb(new) is distinct from to_jsonb(old) then
      perform public.crm_audit_registrar(
        'orcamentos_interacoes',
        new.id::text,
        new.cliente_id,
        'update',
        to_jsonb(old),
        to_jsonb(new),
        jsonb_build_object(
          'operacao', TG_OP,
          'numero_orcamento', new.numero_orcamento
        ),
        'trigger'
      );
    end if;

    return new;
  end if;

  if TG_OP = 'DELETE' then
    perform public.crm_audit_registrar(
      'orcamentos_interacoes',
      old.id::text,
      old.cliente_id,
      'delete',
      to_jsonb(old),
      null,
      jsonb_build_object(
        'operacao', TG_OP,
        'numero_orcamento', old.numero_orcamento
      ),
      'trigger'
    );

    return old;
  end if;

  return null;
end;
$$;

revoke all on function public.crm_audit_orcamentos_interacoes() from public;

drop trigger if exists trg_audit_orcamentos_interacoes
on public.orcamentos_interacoes;

create trigger trg_audit_orcamentos_interacoes
after insert or update or delete on public.orcamentos_interacoes
for each row
execute function public.crm_audit_orcamentos_interacoes();

commit;

-- -----------------------------------------------------------------------------
-- Conferência após executar
-- -----------------------------------------------------------------------------
-- select schemaname, tablename, rowsecurity
-- from pg_tables
-- where schemaname = 'public'
--   and tablename = 'orcamentos_interacoes';
--
-- select policyname, cmd, roles, qual, with_check
-- from pg_policies
-- where schemaname = 'public'
--   and tablename = 'orcamentos_interacoes'
-- order by policyname;

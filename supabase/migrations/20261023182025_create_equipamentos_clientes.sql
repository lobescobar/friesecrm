begin;

create extension if not exists pgcrypto;

create table if not exists public.equipamentos_clientes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  modelo_maquina text not null
    check (char_length(trim(modelo_maquina)) between 1 and 150),
  fabricante text null
    check (fabricante is null or char_length(trim(fabricante)) <= 150),
  codigo_maquina text null
    check (codigo_maquina is null or char_length(trim(codigo_maquina)) <= 100),
  matrizes_ano integer null
    check (matrizes_ano is null or matrizes_ano between 0 and 999999999),
  capas_ano integer null
    check (capas_ano is null or capas_ano between 0 and 999999999),
  historico text null
    check (historico is null or char_length(historico) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.equipamentos_clientes is
  'Equipamentos cadastrados manualmente para cada cliente do CRM.';

create index if not exists equipamentos_clientes_cliente_idx
  on public.equipamentos_clientes (cliente_id, modelo_maquina);

create or replace function public.crm_atualizar_equipamento_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.crm_atualizar_equipamento_updated_at()
  from public, anon, authenticated;

drop trigger if exists trg_equipamentos_clientes_updated_at
  on public.equipamentos_clientes;

create trigger trg_equipamentos_clientes_updated_at
before update on public.equipamentos_clientes
for each row
execute function public.crm_atualizar_equipamento_updated_at();

alter table public.equipamentos_clientes enable row level security;

revoke all on public.equipamentos_clientes from anon;
grant select, insert, update, delete
  on public.equipamentos_clientes to authenticated;

drop policy if exists "equipamentos_select_alcada"
  on public.equipamentos_clientes;
drop policy if exists "equipamentos_insert_alcada"
  on public.equipamentos_clientes;
drop policy if exists "equipamentos_update_alcada"
  on public.equipamentos_clientes;
drop policy if exists "equipamentos_delete_alcada"
  on public.equipamentos_clientes;

create policy "equipamentos_select_alcada"
on public.equipamentos_clientes
for select
to authenticated
using (public.crm_cliente_id_dentro_alcada(cliente_id));

create policy "equipamentos_insert_alcada"
on public.equipamentos_clientes
for insert
to authenticated
with check (public.crm_cliente_id_dentro_alcada(cliente_id));

create policy "equipamentos_update_alcada"
on public.equipamentos_clientes
for update
to authenticated
using (public.crm_cliente_id_dentro_alcada(cliente_id))
with check (public.crm_cliente_id_dentro_alcada(cliente_id));

create policy "equipamentos_delete_alcada"
on public.equipamentos_clientes
for delete
to authenticated
using (public.crm_cliente_id_dentro_alcada(cliente_id));

create or replace function public.crm_audit_equipamentos_clientes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    perform public.crm_audit_registrar(
      'equipamentos_clientes',
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
        'equipamentos_clientes',
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
      'equipamentos_clientes',
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

revoke all on function public.crm_audit_equipamentos_clientes()
  from public, anon, authenticated;

drop trigger if exists trg_audit_equipamentos_clientes
  on public.equipamentos_clientes;

create trigger trg_audit_equipamentos_clientes
after insert or update or delete on public.equipamentos_clientes
for each row
execute function public.crm_audit_equipamentos_clientes();

commit;

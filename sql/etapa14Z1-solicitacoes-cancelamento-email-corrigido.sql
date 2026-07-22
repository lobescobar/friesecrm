-- Etapa 14Z.1 — auditoria do envio automático de solicitações de cancelamento
-- EXECUTAR MANUALMENTE no Supabase SQL Editor após backup.
-- Não altera o status dos orçamentos.

begin;

create extension if not exists pgcrypto;

create table if not exists public.solicitacoes_cancelamento_orcamentos (
  id uuid primary key default gen_random_uuid(),
  chave_idempotencia uuid not null unique,
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  numero_orcamento text not null,
  solicitante_id uuid not null references auth.users(id) on delete restrict,
  solicitante_email text not null,
  vendedor_email text not null,
  segmento_cliente text,
  motivo text not null check (char_length(trim(motivo)) >= 5),
  destinatarios text[] not null default '{}',
  remetente text,
  assunto text not null,
  corpo text not null,
  status_envio text not null
    check (status_envio in ('processando', 'enviado', 'erro')),
  enviado_em timestamptz,
  erro_envio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists solicitacoes_cancelamento_cliente_idx
  on public.solicitacoes_cancelamento_orcamentos (cliente_id, created_at desc);

create index if not exists solicitacoes_cancelamento_orcamento_idx
  on public.solicitacoes_cancelamento_orcamentos (numero_orcamento);

create or replace function public.atualizar_updated_at_solicitacoes_cancelamento()
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

drop trigger if exists solicitacoes_cancelamento_updated_at
  on public.solicitacoes_cancelamento_orcamentos;

create trigger solicitacoes_cancelamento_updated_at
before update on public.solicitacoes_cancelamento_orcamentos
for each row
execute function public.atualizar_updated_at_solicitacoes_cancelamento();

alter table public.solicitacoes_cancelamento_orcamentos enable row level security;

drop policy if exists "solicitacoes_cancelamento_select_proprio_admin"
  on public.solicitacoes_cancelamento_orcamentos;
drop policy if exists "solicitacoes_cancelamento_insert_proprio"
  on public.solicitacoes_cancelamento_orcamentos;
drop policy if exists "solicitacoes_cancelamento_update_proprio"
  on public.solicitacoes_cancelamento_orcamentos;

create policy "solicitacoes_cancelamento_select_proprio_admin"
on public.solicitacoes_cancelamento_orcamentos
for select
to authenticated
using (
  solicitante_id = auth.uid()
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "solicitacoes_cancelamento_insert_proprio"
on public.solicitacoes_cancelamento_orcamentos
for insert
to authenticated
with check (solicitante_id = auth.uid());

create policy "solicitacoes_cancelamento_update_proprio"
on public.solicitacoes_cancelamento_orcamentos
for update
to authenticated
using (solicitante_id = auth.uid())
with check (solicitante_id = auth.uid());

commit;

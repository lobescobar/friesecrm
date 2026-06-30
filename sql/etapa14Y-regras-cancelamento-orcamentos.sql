-- Etapa 14Y - Regras editáveis de cancelamento de orçamentos
-- Execute no Supabase SQL Editor.
-- Segurança:
-- - leitura liberada para usuários autenticados, pois o fluxo de cancelamento precisa consultar o destino;
-- - criação/edição/exclusão liberada somente para administradores cadastrados em public.profiles com role = 'admin';
-- - cada segmento pode apontar para apenas um e-mail;
-- - um e-mail pode atender vários segmentos.

begin;

create extension if not exists pgcrypto;

create table if not exists public.emails_cancelamento_orcamentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null,
  ativo boolean not null default true,
  padrao boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists emails_cancelamento_orcamentos_email_unico_idx
  on public.emails_cancelamento_orcamentos (lower(email));

create unique index if not exists emails_cancelamento_orcamentos_padrao_unico_idx
  on public.emails_cancelamento_orcamentos (padrao)
  where padrao is true and ativo is true;

create table if not exists public.regras_cancelamento_segmentos (
  id uuid primary key default gen_random_uuid(),
  segmento text not null,
  segmento_normalizado text not null,
  email_cancelamento_id uuid not null references public.emails_cancelamento_orcamentos(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists regras_cancelamento_segmentos_segmento_unico_idx
  on public.regras_cancelamento_segmentos (segmento_normalizado);

create index if not exists regras_cancelamento_segmentos_email_idx
  on public.regras_cancelamento_segmentos (email_cancelamento_id);

create or replace function public.atualizar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists emails_cancelamento_orcamentos_updated_at
  on public.emails_cancelamento_orcamentos;

create trigger emails_cancelamento_orcamentos_updated_at
before update on public.emails_cancelamento_orcamentos
for each row
execute function public.atualizar_updated_at();

drop trigger if exists regras_cancelamento_segmentos_updated_at
  on public.regras_cancelamento_segmentos;

create trigger regras_cancelamento_segmentos_updated_at
before update on public.regras_cancelamento_segmentos
for each row
execute function public.atualizar_updated_at();

alter table public.emails_cancelamento_orcamentos enable row level security;
alter table public.regras_cancelamento_segmentos enable row level security;

drop policy if exists "emails_cancelamento_select_auth" on public.emails_cancelamento_orcamentos;
drop policy if exists "emails_cancelamento_insert_admin" on public.emails_cancelamento_orcamentos;
drop policy if exists "emails_cancelamento_update_admin" on public.emails_cancelamento_orcamentos;
drop policy if exists "emails_cancelamento_delete_admin" on public.emails_cancelamento_orcamentos;

create policy "emails_cancelamento_select_auth"
on public.emails_cancelamento_orcamentos
for select
to authenticated
using (true);

create policy "emails_cancelamento_insert_admin"
on public.emails_cancelamento_orcamentos
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "emails_cancelamento_update_admin"
on public.emails_cancelamento_orcamentos
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "emails_cancelamento_delete_admin"
on public.emails_cancelamento_orcamentos
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "regras_cancelamento_select_auth" on public.regras_cancelamento_segmentos;
drop policy if exists "regras_cancelamento_insert_admin" on public.regras_cancelamento_segmentos;
drop policy if exists "regras_cancelamento_update_admin" on public.regras_cancelamento_segmentos;
drop policy if exists "regras_cancelamento_delete_admin" on public.regras_cancelamento_segmentos;

create policy "regras_cancelamento_select_auth"
on public.regras_cancelamento_segmentos
for select
to authenticated
using (true);

create policy "regras_cancelamento_insert_admin"
on public.regras_cancelamento_segmentos
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "regras_cancelamento_update_admin"
on public.regras_cancelamento_segmentos
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "regras_cancelamento_delete_admin"
on public.regras_cancelamento_segmentos
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

-- Cargas iniciais não destrutivas.
-- Se o e-mail já existir, não duplica.
-- Se já existir e-mail padrão ativo, não altera o padrão escolhido pelo admin.

insert into public.emails_cancelamento_orcamentos (nome, email, ativo, padrao)
select 'Vendas AI', 'vendas.ai@friese.com.br', true,
       not exists (
         select 1
         from public.emails_cancelamento_orcamentos
         where ativo is true
           and padrao is true
       )
where not exists (
  select 1
  from public.emails_cancelamento_orcamentos
  where lower(email) = lower('vendas.ai@friese.com.br')
);

insert into public.emails_cancelamento_orcamentos (nome, email, ativo, padrao)
select 'Vendas Corrugados', 'vendas.cr@friese.com.br', true, false
where not exists (
  select 1
  from public.emails_cancelamento_orcamentos
  where lower(email) = lower('vendas.cr@friese.com.br')
);

update public.emails_cancelamento_orcamentos
set padrao = true,
    ativo = true
where lower(email) = lower('vendas.ai@friese.com.br')
  and not exists (
    select 1
    from public.emails_cancelamento_orcamentos
    where ativo is true
      and padrao is true
  );

insert into public.regras_cancelamento_segmentos (
  segmento,
  segmento_normalizado,
  email_cancelamento_id
)
select
  'Corrugados',
  'corrugados',
  emails_cancelamento_orcamentos.id
from public.emails_cancelamento_orcamentos
where lower(email) = lower('vendas.cr@friese.com.br')
on conflict (segmento_normalizado) do nothing;

commit;

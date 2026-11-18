create table if not exists public.emails_resumo_orcamentos_abertos (
  id uuid primary key default gen_random_uuid(),
  chave_execucao text not null unique,
  data_referencia date not null,
  vendedor_email text not null,
  destinatario text not null,
  modo_teste boolean not null default false,
  status text not null default 'processando'
    check (status in ('processando', 'enviado', 'erro')),
  quantidade_orcamentos integer not null default 0
    check (quantidade_orcamentos >= 0),
  origem_importacao text null,
  enviado_em timestamptz null,
  erro text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.emails_resumo_orcamentos_abertos is
  'Controle idempotente dos resumos diários de orçamentos abertos enviados aos vendedores.';

create index if not exists emails_resumo_orcamentos_abertos_data_idx
  on public.emails_resumo_orcamentos_abertos (data_referencia desc, status);

alter table public.emails_resumo_orcamentos_abertos enable row level security;

revoke all on table public.emails_resumo_orcamentos_abertos from public;
revoke all on table public.emails_resumo_orcamentos_abertos from anon;
revoke all on table public.emails_resumo_orcamentos_abertos from authenticated;
grant select, insert, update on table public.emails_resumo_orcamentos_abertos
  to service_role;

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $$
declare
  v_job_id bigint;
begin
  select jobid
    into v_job_id
  from cron.job
  where jobname = 'crm-resumo-orcamentos-abertos'
  limit 1;

  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;
end;
$$;

-- O pg_cron do Supabase usa UTC. 11:00 UTC corresponde a 08:00 em São Paulo.
select cron.schedule(
  'crm-resumo-orcamentos-abertos',
  '0 11 * * *',
  $request$
    select net.http_get(
      url := 'https://friesecrm.vercel.app/api/cron/orcamentos-abertos',
      headers := jsonb_build_object(
        'Authorization',
        'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'crm_reminder_dispatch_secret'
          limit 1
        )
      ),
      timeout_milliseconds := 30000
    );
  $request$
);

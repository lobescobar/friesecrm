begin;

alter table public.equipamentos_clientes
  add column if not exists data_ultima_compra date null,
  add column if not exists lembrete_em timestamptz null,
  add column if not exists lembrete_processando_em timestamptz null,
  add column if not exists lembrete_enviado_em timestamptz null,
  add column if not exists lembrete_responsavel_email text null;

comment on column public.equipamentos_clientes.data_ultima_compra is
  'Data da última compra relacionada ao equipamento.';
comment on column public.equipamentos_clientes.lembrete_em is
  'Data e hora em que o responsável pela carteira deve receber o lembrete.';
comment on column public.equipamentos_clientes.lembrete_processando_em is
  'Instante em que o agendador reservou o lembrete para envio.';
comment on column public.equipamentos_clientes.lembrete_enviado_em is
  'Instante em que o lembrete foi enviado ao responsável.';
comment on column public.equipamentos_clientes.lembrete_responsavel_email is
  'E-mail do vendedor responsável que recebeu o lembrete.';

create index if not exists equipamentos_clientes_lembretes_pendentes_idx
  on public.equipamentos_clientes (lembrete_em)
  where lembrete_em is not null
    and lembrete_enviado_em is null;

create or replace function public.crm_atualizar_equipamento_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();

  if new.lembrete_em is distinct from old.lembrete_em then
    new.lembrete_processando_em = null;
    new.lembrete_enviado_em = null;
    new.lembrete_responsavel_email = null;
  end if;

  return new;
end;
$$;

revoke all on function public.crm_atualizar_equipamento_updated_at()
  from public, anon, authenticated;

create or replace function public.crm_claim_lembretes_equipamentos(
  p_agora timestamptz,
  p_limite integer default 100
)
returns setof public.equipamentos_clientes
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidatas as (
    select equipamento.id
    from public.equipamentos_clientes as equipamento
    where equipamento.lembrete_em is not null
      and equipamento.lembrete_em <= p_agora
      and equipamento.lembrete_enviado_em is null
      and (
        equipamento.lembrete_processando_em is null
        or equipamento.lembrete_processando_em < p_agora - interval '15 minutes'
      )
    order by equipamento.lembrete_em asc
    for update skip locked
    limit greatest(1, least(coalesce(p_limite, 100), 500))
  ), reservadas as (
    update public.equipamentos_clientes as equipamento
    set lembrete_processando_em = p_agora
    from candidatas
    where equipamento.id = candidatas.id
    returning equipamento.*
  )
  select * from reservadas;
end;
$$;

revoke all on function public.crm_claim_lembretes_equipamentos(
  timestamptz,
  integer
) from public, anon, authenticated;

grant execute on function public.crm_claim_lembretes_equipamentos(
  timestamptz,
  integer
) to service_role;

commit;

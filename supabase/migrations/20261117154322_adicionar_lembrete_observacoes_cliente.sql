begin;

alter table public.clientes
  add column if not exists observacoes_lembrete_em timestamptz null,
  add column if not exists observacoes_lembrete_processando_em timestamptz null,
  add column if not exists observacoes_lembrete_enviado_em timestamptz null,
  add column if not exists observacoes_lembrete_responsavel_email text null;

comment on column public.clientes.observacoes_lembrete_em is
  'Data e hora em que o responsável pela carteira deve receber a observação.';
comment on column public.clientes.observacoes_lembrete_processando_em is
  'Instante em que o agendador reservou o lembrete para envio.';
comment on column public.clientes.observacoes_lembrete_enviado_em is
  'Instante em que o lembrete da observação foi enviado.';
comment on column public.clientes.observacoes_lembrete_responsavel_email is
  'E-mail do vendedor responsável que recebeu o lembrete.';

create index if not exists clientes_observacoes_lembretes_pendentes_idx
  on public.clientes (observacoes_lembrete_em)
  where observacoes_lembrete_em is not null
    and observacoes_lembrete_enviado_em is null;

create or replace function public.crm_bloquear_update_cliente_erp()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_role text := coalesce(
    current_setting('request.jwt.claim.role', true),
    ''
  );
  v_claims jsonb := coalesce(
    nullif(current_setting('request.jwt.claims', true), ''),
    '{}'
  )::jsonb;
begin
  if v_role = '' then
    v_role := coalesce(v_claims ->> 'role', '');
  end if;

  if v_role = 'service_role' then
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if new.observacoes_lembrete_em is distinct from old.observacoes_lembrete_em then
    new.observacoes_lembrete_processando_em = null;
    new.observacoes_lembrete_enviado_em = null;
    new.observacoes_lembrete_responsavel_email = null;
  elsif not public.is_admin(auth.uid()) then
    new.observacoes_lembrete_processando_em =
      old.observacoes_lembrete_processando_em;
    new.observacoes_lembrete_enviado_em = old.observacoes_lembrete_enviado_em;
    new.observacoes_lembrete_responsavel_email =
      old.observacoes_lembrete_responsavel_email;
  end if;

  if public.is_admin(auth.uid()) then
    return new;
  end if;

  if (
    to_jsonb(new) - array[
      'observacoes',
      'observacoes_lembrete_em',
      'observacoes_lembrete_processando_em',
      'observacoes_lembrete_enviado_em',
      'observacoes_lembrete_responsavel_email',
      'updated_at'
    ]
  ) is distinct from (
    to_jsonb(old) - array[
      'observacoes',
      'observacoes_lembrete_em',
      'observacoes_lembrete_processando_em',
      'observacoes_lembrete_enviado_em',
      'observacoes_lembrete_responsavel_email',
      'updated_at'
    ]
  ) then
    raise exception
      'Usuário comum só pode alterar observações e lembretes do cliente. Dados ERP são bloqueados.';
  end if;

  return new;
end;
$$;

revoke all on function public.crm_bloquear_update_cliente_erp()
  from public, anon, authenticated;

create or replace function public.crm_claim_lembretes_observacoes(
  p_agora timestamptz,
  p_limite integer default 100
)
returns setof public.clientes
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidatas as (
    select cliente.id
    from public.clientes as cliente
    where cliente.observacoes_lembrete_em is not null
      and cliente.observacoes_lembrete_em <= p_agora
      and nullif(trim(cliente.observacoes), '') is not null
      and cliente.observacoes_lembrete_enviado_em is null
      and (
        cliente.observacoes_lembrete_processando_em is null
        or cliente.observacoes_lembrete_processando_em
          < p_agora - interval '15 minutes'
      )
    order by cliente.observacoes_lembrete_em asc
    for update skip locked
    limit greatest(1, least(coalesce(p_limite, 100), 500))
  ), reservadas as (
    update public.clientes as cliente
    set observacoes_lembrete_processando_em = p_agora
    from candidatas
    where cliente.id = candidatas.id
    returning cliente.*
  )
  select * from reservadas;
end;
$$;

revoke all on function public.crm_claim_lembretes_observacoes(
  timestamptz,
  integer
) from public, anon, authenticated;

grant execute on function public.crm_claim_lembretes_observacoes(
  timestamptz,
  integer
) to service_role;

commit;

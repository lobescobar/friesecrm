alter table public.clientes
  add column if not exists comprou_ultimos_12_meses boolean not null default false;

comment on column public.clientes.comprou_ultimos_12_meses is
  'Indica se o cliente possui orçamento fechado (status B) com data de fechamento nos últimos 12 meses.';

alter table public.clientes
  disable trigger trg_bloquear_update_cliente_erp;

update public.clientes as cliente
set
  status = case
    when exists (
      select 1
      from public.orcamentos_historico as orcamento
      where orcamento.cliente_id = cliente.id
        and orcamento.data_emissao >= current_date - interval '18 months'
    ) then 'Ativo'
    else 'Inativo'
  end,
  comprou_ultimos_12_meses = exists (
    select 1
    from public.orcamentos_historico as orcamento
    where orcamento.cliente_id = cliente.id
      and orcamento.status = 'B'
      and orcamento.data_fechamento >= current_date - interval '12 months'
  );

alter table public.clientes
  enable trigger trg_bloquear_update_cliente_erp;

-- Etapa 12 — Recalcular status dos clientes por orçamento recente
-- Regra:
-- Ativo   = cliente com ao menos 1 orçamento emitido nos últimos 18 meses
-- Inativo = cliente sem orçamento nos últimos 18 meses ou sem histórico

-- Este script não apaga clientes, contatos ou orçamentos.
-- Ele atualiza apenas o campo public.clientes.status.

update public.clientes
set
  status = 'Inativo',
  updated_at = now()
where status is distinct from 'Inativo';

update public.clientes c
set
  status = 'Ativo',
  updated_at = now()
where exists (
  select 1
  from public.orcamentos_historico oh
  where oh.cliente_id = c.id
    and oh.data_emissao >= (current_date - interval '18 months')::date
)
and c.status is distinct from 'Ativo';

select
  status,
  count(*) as quantidade
from public.clientes
group by status
order by status;

begin;

alter table public.solicitacoes_cancelamento_orcamentos
  alter column solicitante_id drop not null;

alter table public.solicitacoes_cancelamento_orcamentos
  drop constraint if exists solicitacoes_cancelamento_orcamentos_solicitante_id_fkey;

alter table public.solicitacoes_cancelamento_orcamentos
  add constraint solicitacoes_cancelamento_orcamentos_solicitante_id_fkey
  foreign key (solicitante_id)
  references auth.users(id)
  on delete set null;

create index if not exists solicitacoes_cancelamento_solicitante_idx
  on public.solicitacoes_cancelamento_orcamentos (solicitante_id)
  where solicitante_id is not null;

commit;

-- Etapa 4 — adicionar data de fechamento ao histórico de orçamentos.
-- Execute uma vez no Supabase SQL Editor.
-- Não apaga dados existentes.

alter table public.orcamentos_historico
add column if not exists data_fechamento date null;

create index if not exists idx_orcamentos_historico_data_fechamento
on public.orcamentos_historico (data_fechamento);

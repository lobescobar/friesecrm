-- Tabela inicial para o Histórico do Cliente / Orçamentos.
-- Este SQL já foi executado com sucesso no Supabase, mas fica aqui como registro.

create table if not exists public.orcamentos_historico (
  id uuid primary key default gen_random_uuid(),

  cliente_id uuid references public.clientes(id) on delete set null,

  codigo_cliente text not null,
  loja text not null,
  codigo_cliente_loja text not null,

  numero_it_completo text not null,
  numero_orcamento text not null,

  pedido_venda text null,

  status text not null,
  status_descricao text not null,

  data_emissao date not null,

  origem_importacao text default 'planilha_orcamentos_crm',

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint orcamentos_historico_status_check
    check (status in ('A', 'B', 'C'))
);

create unique index if not exists ux_orcamentos_historico_cliente_item
on public.orcamentos_historico (codigo_cliente_loja, numero_it_completo);

create index if not exists idx_orcamentos_historico_cliente_id
on public.orcamentos_historico (cliente_id);

create index if not exists idx_orcamentos_historico_codigo_cliente_loja
on public.orcamentos_historico (codigo_cliente_loja);

create index if not exists idx_orcamentos_historico_data_emissao
on public.orcamentos_historico (data_emissao);

create index if not exists idx_orcamentos_historico_status
on public.orcamentos_historico (status);

alter table public.orcamentos_historico enable row level security;

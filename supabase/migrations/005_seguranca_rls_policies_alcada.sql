-- Etapa 14S - Segurança Supabase, RLS e políticas por alçada
-- CRM Friese / Mini CRM Mapa
--
-- OBJETIVO
-- 1. Remover policies públicas abertas em clientes e contatos_clientes.
-- 2. Manter acesso por usuário autenticado.
-- 3. Admin pode gerenciar tudo.
-- 4. Vendedor/usuário comum só acessa clientes da própria alçada
--    por segmentos_permitidos e estados_permitidos em public.profiles.
-- 5. Usuário comum pode criar, alterar e excluir contatos dos clientes da sua alçada.
-- 6. Usuário comum NÃO pode alterar dados ERP em clientes; apenas observacoes.
-- 7. Usuário comum apenas lê orcamentos_historico da própria alçada.
--
-- IMPORTANTE
-- Execute primeiro em produção somente depois de backup do banco.
-- Confirme que existe um usuário admin em public.profiles antes de executar.

begin;

-- -----------------------------------------------------------------------------
-- 1) Garantir RLS nas tabelas principais
-- -----------------------------------------------------------------------------
alter table public.clientes enable row level security;
alter table public.contatos_clientes enable row level security;
alter table public.orcamentos_historico enable row level security;
alter table public.profiles enable row level security;

-- -----------------------------------------------------------------------------
-- 2) Funções auxiliares de segurança por alçada
-- -----------------------------------------------------------------------------

-- Mantém/recria a função de admin de forma explícita e segura.
create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_id
      and role = 'admin'
  );
$$;

-- Verifica se o usuário logado tem acesso a um cliente a partir do segmento/UF.
-- Regras:
-- - admin: acesso total;
-- - vendedor: acesso se segmento e estado estiverem dentro das listas permitidas;
-- - lista nula/vazia significa "sem restrição" naquele eixo.
create or replace function public.crm_usuario_tem_alcada(
  p_segmento text,
  p_estado text
)
returns boolean
language sql
security definer
stable
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        p.role = 'admin'
        or (
          (
            coalesce(array_length(p.segmentos_permitidos, 1), 0) = 0
            or p_segmento = any (p.segmentos_permitidos)
          )
          and
          (
            coalesce(array_length(p.estados_permitidos, 1), 0) = 0
            or p_estado = any (p.estados_permitidos)
          )
        )
      )
  );
$$;

-- Verifica alçada pelo id do cliente, útil para contatos e histórico.
create or replace function public.crm_cliente_id_dentro_alcada(p_cliente_id uuid)
returns boolean
language sql
security definer
stable
set search_path to 'public'
as $$
  select
    coalesce(public.is_admin(auth.uid()), false)
    or exists (
      select 1
      from public.profiles p
      join public.clientes c on c.id = p_cliente_id
      where p.id = auth.uid()
        and (
          (
            coalesce(array_length(p.segmentos_permitidos, 1), 0) = 0
            or c.segmento = any (p.segmentos_permitidos)
          )
          and
          (
            coalesce(array_length(p.estados_permitidos, 1), 0) = 0
            or c.estado = any (p.estados_permitidos)
          )
        )
    );
$$;

revoke all on function public.is_admin(uuid) from public;
revoke all on function public.crm_usuario_tem_alcada(text, text) from public;
revoke all on function public.crm_cliente_id_dentro_alcada(uuid) from public;

grant execute on function public.is_admin(uuid) to authenticated;
grant execute on function public.crm_usuario_tem_alcada(text, text) to authenticated;
grant execute on function public.crm_cliente_id_dentro_alcada(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 3) Trigger para impedir que vendedor altere dados ERP em clientes
-- -----------------------------------------------------------------------------
-- RLS limita a linha. Este trigger limita as colunas.
-- Usuário comum só pode alterar observacoes. Admin pode alterar tudo.
-- A comparação por JSONB permite bloquear qualquer coluna ERP, mesmo que a tabela
-- tenha muitas colunas.
create or replace function public.crm_bloquear_update_cliente_erp()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if public.is_admin(auth.uid()) then
    return new;
  end if;

  -- Permitimos somente alterações em observacoes.
  -- Remover uma chave inexistente no JSONB não gera erro, então updated_at fica
  -- listado apenas como tolerância caso a coluna exista no futuro.
  if (to_jsonb(new) - array['observacoes', 'updated_at'])
     is distinct from
     (to_jsonb(old) - array['observacoes', 'updated_at']) then
    raise exception 'Usuário comum só pode alterar observações do cliente. Dados ERP são bloqueados.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_bloquear_update_cliente_erp on public.clientes;

create trigger trg_bloquear_update_cliente_erp
before update on public.clientes
for each row
execute function public.crm_bloquear_update_cliente_erp();

-- -----------------------------------------------------------------------------
-- 4) Remover policies antigas abertas/permissivas
-- -----------------------------------------------------------------------------

-- clientes
DROP POLICY IF EXISTS "Permitir cadastro publico" ON public.clientes;
DROP POLICY IF EXISTS "Permitir exclusao publica" ON public.clientes;
DROP POLICY IF EXISTS "Permitir leitura publica" ON public.clientes;
DROP POLICY IF EXISTS "Permitir update publico" ON public.clientes;
DROP POLICY IF EXISTS "clientes_select_alcada" ON public.clientes;
DROP POLICY IF EXISTS "clientes_insert_admin" ON public.clientes;
DROP POLICY IF EXISTS "clientes_update_admin" ON public.clientes;
DROP POLICY IF EXISTS "clientes_update_observacoes_alcada" ON public.clientes;
DROP POLICY IF EXISTS "clientes_delete_admin" ON public.clientes;

-- contatos_clientes
DROP POLICY IF EXISTS "Permitir delete contatos" ON public.contatos_clientes;
DROP POLICY IF EXISTS "Permitir insert contatos" ON public.contatos_clientes;
DROP POLICY IF EXISTS "Permitir leitura contatos" ON public.contatos_clientes;
DROP POLICY IF EXISTS "Permitir update contatos" ON public.contatos_clientes;
DROP POLICY IF EXISTS "contatos_select_alcada" ON public.contatos_clientes;
DROP POLICY IF EXISTS "contatos_insert_alcada" ON public.contatos_clientes;
DROP POLICY IF EXISTS "contatos_update_alcada" ON public.contatos_clientes;
DROP POLICY IF EXISTS "contatos_delete_alcada" ON public.contatos_clientes;

-- orcamentos_historico
DROP POLICY IF EXISTS "Admins podem atualizar historico de orcamentos" ON public.orcamentos_historico;
DROP POLICY IF EXISTS "Admins podem excluir historico de orcamentos" ON public.orcamentos_historico;
DROP POLICY IF EXISTS "Admins podem inserir historico de orcamentos" ON public.orcamentos_historico;
DROP POLICY IF EXISTS "Usuarios autenticados podem ler historico de orcamentos" ON public.orcamentos_historico;
DROP POLICY IF EXISTS "orcamentos_select_alcada" ON public.orcamentos_historico;
DROP POLICY IF EXISTS "orcamentos_insert_admin" ON public.orcamentos_historico;
DROP POLICY IF EXISTS "orcamentos_update_admin" ON public.orcamentos_historico;
DROP POLICY IF EXISTS "orcamentos_delete_admin" ON public.orcamentos_historico;

-- profiles
DROP POLICY IF EXISTS "Usuários veem o próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin_all" ON public.profiles;

-- -----------------------------------------------------------------------------
-- 5) Novas policies - clientes
-- -----------------------------------------------------------------------------

create policy "clientes_select_alcada"
on public.clientes
for select
to authenticated
using (
  public.crm_usuario_tem_alcada(segmento, estado)
);

create policy "clientes_insert_admin"
on public.clientes
for insert
to authenticated
with check (
  public.is_admin(auth.uid())
);

create policy "clientes_update_admin"
on public.clientes
for update
to authenticated
using (
  public.is_admin(auth.uid())
)
with check (
  public.is_admin(auth.uid())
);

create policy "clientes_update_observacoes_alcada"
on public.clientes
for update
to authenticated
using (
  public.crm_usuario_tem_alcada(segmento, estado)
)
with check (
  public.crm_usuario_tem_alcada(segmento, estado)
);

create policy "clientes_delete_admin"
on public.clientes
for delete
to authenticated
using (
  public.is_admin(auth.uid())
);

-- -----------------------------------------------------------------------------
-- 6) Novas policies - contatos_clientes
-- -----------------------------------------------------------------------------
-- Usuário comum pode ler/criar/alterar/excluir contatos de clientes de sua alçada.
-- Contatos são dados operacionais do CRM, não dados importados do ERP.

create policy "contatos_select_alcada"
on public.contatos_clientes
for select
to authenticated
using (
  public.crm_cliente_id_dentro_alcada(cliente_id)
);

create policy "contatos_insert_alcada"
on public.contatos_clientes
for insert
to authenticated
with check (
  public.crm_cliente_id_dentro_alcada(cliente_id)
);

create policy "contatos_update_alcada"
on public.contatos_clientes
for update
to authenticated
using (
  public.crm_cliente_id_dentro_alcada(cliente_id)
)
with check (
  public.crm_cliente_id_dentro_alcada(cliente_id)
);

create policy "contatos_delete_alcada"
on public.contatos_clientes
for delete
to authenticated
using (
  public.crm_cliente_id_dentro_alcada(cliente_id)
);

-- -----------------------------------------------------------------------------
-- 7) Novas policies - orcamentos_historico
-- -----------------------------------------------------------------------------
-- Histórico ERP/orçamentos: vendedor lê sua alçada; só admin importa/altera/exclui.

create policy "orcamentos_select_alcada"
on public.orcamentos_historico
for select
to authenticated
using (
  public.crm_cliente_id_dentro_alcada(cliente_id)
);

create policy "orcamentos_insert_admin"
on public.orcamentos_historico
for insert
to authenticated
with check (
  public.is_admin(auth.uid())
);

create policy "orcamentos_update_admin"
on public.orcamentos_historico
for update
to authenticated
using (
  public.is_admin(auth.uid())
)
with check (
  public.is_admin(auth.uid())
);

create policy "orcamentos_delete_admin"
on public.orcamentos_historico
for delete
to authenticated
using (
  public.is_admin(auth.uid())
);

-- -----------------------------------------------------------------------------
-- 8) Novas policies - profiles
-- -----------------------------------------------------------------------------
-- Usuário comum vê só o próprio perfil. Admin gerencia todos.

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (
  auth.uid() = id
);

create policy "profiles_select_admin_all"
on public.profiles
for select
to authenticated
using (
  public.is_admin(auth.uid())
);

create policy "profiles_insert_admin_all"
on public.profiles
for insert
to authenticated
with check (
  public.is_admin(auth.uid())
);

create policy "profiles_update_admin_all"
on public.profiles
for update
to authenticated
using (
  public.is_admin(auth.uid())
)
with check (
  public.is_admin(auth.uid())
);

create policy "profiles_delete_admin_all"
on public.profiles
for delete
to authenticated
using (
  public.is_admin(auth.uid())
);

commit;

-- -----------------------------------------------------------------------------
-- CONSULTAS DE CONFERÊNCIA APÓS EXECUTAR
-- -----------------------------------------------------------------------------
-- select schemaname, tablename, rowsecurity
-- from pg_tables
-- where schemaname = 'public'
-- order by tablename;
--
-- select schemaname, tablename, policyname, cmd, roles, qual, with_check
-- from pg_policies
-- where schemaname = 'public'
--   and tablename in ('clientes','contatos_clientes','orcamentos_historico','profiles')
-- order by tablename, policyname;

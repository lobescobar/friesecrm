-- ROLLBACK DE EMERGÊNCIA - Etapa 14S
-- Use somente se a Etapa 14S bloquear o CRM e você precisar reabrir acesso
-- temporariamente para recuperar a operação.
-- Depois de reabrir, avise o LOSBE para corrigirmos a policy específica.

begin;

-- Remove policies seguras novas.
DROP POLICY IF EXISTS "clientes_select_alcada" ON public.clientes;
DROP POLICY IF EXISTS "clientes_insert_admin" ON public.clientes;
DROP POLICY IF EXISTS "clientes_update_admin" ON public.clientes;
DROP POLICY IF EXISTS "clientes_update_observacoes_alcada" ON public.clientes;
DROP POLICY IF EXISTS "clientes_delete_admin" ON public.clientes;

DROP POLICY IF EXISTS "contatos_select_alcada" ON public.contatos_clientes;
DROP POLICY IF EXISTS "contatos_insert_alcada" ON public.contatos_clientes;
DROP POLICY IF EXISTS "contatos_update_alcada" ON public.contatos_clientes;
DROP POLICY IF EXISTS "contatos_delete_alcada" ON public.contatos_clientes;

DROP POLICY IF EXISTS "orcamentos_select_alcada" ON public.orcamentos_historico;
DROP POLICY IF EXISTS "orcamentos_insert_admin" ON public.orcamentos_historico;
DROP POLICY IF EXISTS "orcamentos_update_admin" ON public.orcamentos_historico;
DROP POLICY IF EXISTS "orcamentos_delete_admin" ON public.orcamentos_historico;

DROP POLICY IF EXISTS "profiles_insert_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin_all" ON public.profiles;

-- Remove trigger de bloqueio de campos ERP em clientes.
drop trigger if exists trg_bloquear_update_cliente_erp on public.clientes;

-- Reabre temporariamente como estava antes nas tabelas críticas.
create policy "Permitir leitura publica"
on public.clientes
for select
to public
using (true);

create policy "Permitir cadastro publico"
on public.clientes
for insert
to public
with check (true);

create policy "Permitir update publico"
on public.clientes
for update
to public
using (true)
with check (true);

create policy "Permitir exclusao publica"
on public.clientes
for delete
to public
using (true);

create policy "Permitir leitura contatos"
on public.contatos_clientes
for select
to public
using (true);

create policy "Permitir insert contatos"
on public.contatos_clientes
for insert
to public
with check (true);

create policy "Permitir update contatos"
on public.contatos_clientes
for update
to public
using (true)
with check (true);

create policy "Permitir delete contatos"
on public.contatos_clientes
for delete
to public
using (true);

-- Recria policies básicas de profiles.
create policy "profiles_select_own"
on public.profiles
for select
to public
using (auth.uid() = id);

create policy "profiles_select_admin_all"
on public.profiles
for select
to public
using (public.is_admin(auth.uid()));

create policy "profiles_insert_admin_all"
on public.profiles
for insert
to public
with check (public.is_admin(auth.uid()));

create policy "profiles_update_admin_all"
on public.profiles
for update
to public
using (public.is_admin(auth.uid()));

commit;

create policy "service_role_gerencia_resumos_orcamentos_abertos"
on public.emails_resumo_orcamentos_abertos
for all
to service_role
using (true)
with check (true);

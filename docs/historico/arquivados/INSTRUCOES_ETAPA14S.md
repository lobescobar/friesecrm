# Etapa 14S — Segurança Supabase, RLS e políticas por alçada

## Objetivo

Corrigir o risco identificado nas tabelas `clientes` e `contatos_clientes`, que estavam com RLS ativo, mas com policies públicas abertas (`public true`).

## Regra aprovada

### Admin

Pode ler, criar, alterar e excluir tudo nas tabelas principais.

### Usuário comum / vendedor

Pode:

- ver clientes da própria alçada;
- criar contatos dos clientes da própria alçada;
- alterar contatos dos clientes da própria alçada;
- excluir contatos dos clientes da própria alçada;
- ver histórico de orçamentos dos clientes da própria alçada;
- alterar apenas `observacoes` em clientes da própria alçada.

Não pode:

- alterar dados importados do ERP em `clientes`;
- excluir clientes;
- criar clientes manualmente;
- inserir, alterar ou excluir `orcamentos_historico`.

## Arquivos incluídos

```txt
supabase/seguranca_rls_policies_alcada.sql
supabase/ROLLBACK_EMERGENCIA_REABRIR_POLICIES_PUBLICAS.sql
```

## Antes de executar

1. Faça backup do banco Supabase.
2. Confirme que existe usuário admin em `profiles`.
3. Confirme que seu usuário atual é admin:

```sql
select id, email, role
from profiles
where email = 'luis@friese.com.br';
```

O resultado precisa mostrar:

```txt
role = admin
```

## Como executar

No Supabase SQL Editor, abra o arquivo:

```txt
supabase/seguranca_rls_policies_alcada.sql
```

Cole o conteúdo inteiro e clique em **Run**.

## O que testar depois

### Como admin

1. Login no CRM.
2. Conferir se os clientes carregam.
3. Abrir um cliente.
4. Alterar observações e salvar.
5. Criar, alterar e excluir contato.
6. Abrir histórico do cliente.
7. Importar clientes/orçamentos, se essa operação estiver autorizada no usuário admin.

### Como usuário comum

1. Login com usuário vendedor.
2. Verificar se aparecem apenas clientes da alçada.
3. Abrir cliente permitido.
4. Alterar observações e salvar.
5. Criar contato.
6. Alterar contato.
7. Excluir contato.
8. Abrir histórico de orçamentos.
9. Confirmar que não aparecem clientes fora da alçada.

## Consultas de conferência

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

```sql
select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('clientes','contatos_clientes','orcamentos_historico','profiles')
order by tablename, policyname;
```

## Se o CRM travar

Use apenas em emergência o arquivo:

```txt
supabase/ROLLBACK_EMERGENCIA_REABRIR_POLICIES_PUBLICAS.sql
```

Esse rollback reabre temporariamente as policies públicas antigas para recuperar o acesso. Depois disso, a segurança precisará ser ajustada novamente.

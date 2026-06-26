# Etapa 14U — Auditoria do CRM

## Objetivo

Criar a auditoria inicial do CRM Friese / Mini CRM Mapa, registrando quem alterou, quando alterou, em qual tabela/cliente, qual ação foi executada, valor anterior, valor novo e detalhes complementares.

Esta etapa foi desenhada para manter as regras já validadas na Etapa 14S:

- Admin continua com acesso completo.
- Vendedor comum continua limitado à própria alçada.
- Vendedor comum continua podendo criar, alterar e excluir contatos da sua alçada.
- Vendedor comum continua podendo alterar apenas observações do cliente.
- Vendedor comum continua sem permissão para alterar/importar dados ERP.

## Arquivos adicionados

- `supabase/migrations/006_audit_log_crm.sql`
- `supabase/rollback/ROLLBACK_ETAPA14U_AUDITORIA.sql`
- `lib/auditoria.ts`

## Arquivos alterados

- `components/crm/ImportarERP.tsx`
- `components/crm/ImportarOrcamentos.tsx`
- `types/index.ts`

## O que a auditoria registra agora

### 1. Contatos de clientes

A tabela `contatos_clientes` passa a ser auditada automaticamente por trigger:

- criação de contato: `acao = insert`
- alteração de contato: `acao = update`
- exclusão de contato: `acao = delete`

O log registra:

- usuário autenticado;
- e-mail do usuário salvo em `profiles`;
- tabela alterada;
- ID do contato;
- ID do cliente relacionado;
- valor anterior;
- valor novo.

### 2. Observações de clientes

A tabela `clientes` passa a auditar automaticamente apenas mudanças no campo `observacoes`:

- alteração de observação: `acao = update_observacoes`

O log registra o valor anterior e o valor novo de `observacoes`.

### 3. Importações

As importações passam a registrar um evento resumido na auditoria:

- Importação ERP / cadastro de clientes: `acao = importacao_erp`
- Importação de orçamentos / histórico: `acao = importacao_orcamentos`

Esses eventos ficam com `valor_anterior` e `valor_novo` nulos, e o resumo fica em `detalhes`, incluindo nome do arquivo e totais da importação.

## Segurança da tabela audit_log

A tabela `audit_log` tem RLS habilitado.

- Admin pode consultar os logs.
- Vendedor comum não consulta logs.
- Frontend não insere, altera ou exclui logs diretamente.
- Logs são gravados por triggers e por função segura `SECURITY DEFINER`.
- A função de importação só permite registro por admin.

## Como executar no Supabase

1. Acesse o Supabase do projeto.
2. Abra o SQL Editor.
3. Execute o arquivo:

```sql
supabase/migrations/006_audit_log_crm.sql
```

4. A mensagem esperada é semelhante a:

```text
Success. No rows returned
```

## Conferência depois de executar

### Verificar se a tabela existe com RLS

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename = 'audit_log';
```

Resultado esperado: `rowsecurity = true`.

### Verificar policies da auditoria

```sql
select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'audit_log'
order by policyname;
```

Resultado esperado: policy `audit_log_select_admin`.

### Verificar triggers criadas

```sql
select event_object_table, trigger_name, event_manipulation
from information_schema.triggers
where trigger_schema = 'public'
  and event_object_table in ('clientes', 'contatos_clientes')
order by event_object_table, trigger_name, event_manipulation;
```

Resultado esperado:

- `trg_audit_contatos_clientes` em `contatos_clientes`;
- `trg_audit_clientes_observacoes` em `clientes`.

### Ver últimos logs

```sql
select created_at, user_email, tabela, registro_id, cliente_id, acao, origem, detalhes
from public.audit_log
order by created_at desc
limit 50;
```

## Testes funcionais recomendados

### Como admin

1. Entrar no CRM com usuário admin.
2. Alterar uma observação de cliente.
3. Criar, alterar e excluir um contato.
4. Importar uma planilha ERP pequena.
5. Importar uma planilha de orçamentos pequena.
6. Executar a consulta dos últimos logs.

Resultado esperado: aparecem logs para observação, contatos e importações.

### Como vendedor comum

1. Entrar com vendedor comum.
2. Alterar uma observação de cliente da alçada.
3. Criar, alterar e excluir um contato de cliente da alçada.
4. Tentar acessar `audit_log` via consulta/API comum.

Resultado esperado:

- alterações permitidas continuam funcionando;
- logs são criados automaticamente;
- vendedor não consegue ler `audit_log`.

## Observação importante

A auditoria de importação é resumida de propósito. Ela registra o evento, arquivo e totais. Não foi criada uma linha de auditoria para cada registro importado, porque isso geraria um volume muito grande de logs e dificultaria a leitura operacional.

## Rollback

Se precisar remover a Etapa 14U, execute:

```sql
supabase/rollback/ROLLBACK_ETAPA14U_AUDITORIA.sql
```

Esse rollback remove triggers, funções e a tabela `audit_log`.

# Etapa 4B.1.2 — Corrigir filtro Área do Funil Comercial

## Base segura

Usar como base:

```text
backup-mini-crm-mapa-apos-etapa4B1-funil-volume-orcamentos-funcionando
```

## Motivo da correção

O erro no console:

```text
Erro ao carregar funil de orçamentos: {}
PATCH/GET Supabase 400 Bad Request
```

aconteceu porque o filtro Área passou a consultar o campo:

```text
ramo
```

na tabela:

```text
orcamentos_historico
```

mas a tabela original ainda não possuía essa coluna.

## Regra confirmada

- Área = coluna P da planilha ERP = `ramo`
- Período = coluna N da planilha ERP = `data_emissao`

## Arquivos alterados

Substituir/adicionar:

```text
hooks/useFunilOrcamentos.ts
utils/importacaoOrcamentos.ts
types/importacaoOrcamentos.ts
lib/importacaoOrcamentos.ts
supabase/migrations/20260703_add_ramo_orcamentos_historico.sql
```

## SQL obrigatório antes de testar o filtro Área

Rodar no Supabase SQL Editor:

```sql
ALTER TABLE public.orcamentos_historico
ADD COLUMN IF NOT EXISTS ramo text NULL;

COMMENT ON COLUMN public.orcamentos_historico.ramo IS
'Área/ramo do orçamento importado da coluna P da planilha ERP. Usado no filtro Área do funil comercial.';

CREATE INDEX IF NOT EXISTS idx_orcamentos_historico_ramo
ON public.orcamentos_historico (ramo);
```

## Observação importante

Os orçamentos já importados anteriormente não terão `ramo` preenchido automaticamente, porque esse campo ainda não existia quando foram importados.

Para o filtro Área aparecer com valores como `Agroindustria`, `Corrugado` e `Trat Termico`, será necessário reimportar a planilha de orçamentos após aplicar este patch e rodar o SQL.

## Teste

1. Rodar o SQL.
2. Substituir os arquivos do patch.
3. Rodar:

```bash
npm run dev
```

4. Abrir:

```text
CRM > Orçamentos
```

5. Conferir se o erro 400 sumiu.
6. Reimportar a planilha de orçamentos.
7. Conferir se o filtro Área aparece preenchido.

## Validação local

A checagem `npm run typecheck` não foi conclusiva neste ambiente porque a pasta de trabalho está sem `node_modules`/tipagens instaladas. No computador do projeto, rodar:

```bash
npm install
npm run typecheck
npm run lint
npm run build
```

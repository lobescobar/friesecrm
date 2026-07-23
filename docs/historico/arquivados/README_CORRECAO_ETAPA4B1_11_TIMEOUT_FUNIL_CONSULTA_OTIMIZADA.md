# Etapa 4B.1.11 — Corrigir timeout do Funil Comercial

## Problema

O funil passou a consultar histórico completo e o Supabase retornou:

```text
canceling statement due to statement timeout | 57014
```

Isso ocorreu porque o hook estava buscando todas as linhas do histórico com ordenação geral, e depois calculava tudo no navegador.

## Correção

Arquivo alterado:

```text
hooks/useFunilOrcamentos.ts
```

O funil agora consulta cada grupo separadamente:

```text
Abertos    → status A + data_emissao
Fechados   → status B + data_fechamento
Cancelados → status C + data_cancelamento
```

O filtro de período e mês agora é aplicado direto na consulta do Supabase.

Também foi removida a ordenação geral por `data_emissao`, que causava lentidão.

## SQL recomendado

Rodar no Supabase:

```sql
CREATE INDEX IF NOT EXISTS idx_orcamentos_historico_funil_status_emissao
ON public.orcamentos_historico (status, data_emissao);

CREATE INDEX IF NOT EXISTS idx_orcamentos_historico_funil_status_fechamento
ON public.orcamentos_historico (status, data_fechamento);

CREATE INDEX IF NOT EXISTS idx_orcamentos_historico_funil_status_cancelamento
ON public.orcamentos_historico (status, data_cancelamento);

CREATE INDEX IF NOT EXISTS idx_orcamentos_historico_funil_status_ramo
ON public.orcamentos_historico (status, ramo);

CREATE INDEX IF NOT EXISTS idx_orcamentos_historico_funil_valor_total
ON public.orcamentos_historico (valor_total);
```

## Teste

1. Rodar `npm run dev`.
2. Abrir CRM > Orçamentos.
3. Testar:
   - Área: Todas
   - Período: 2025
   - Mês: Todos
4. Comparar Fechados com Excel:
   - Status B
   - Fechamento 2025
   - Soma da coluna I / Vlr.Total.

# Etapa 4B.1.1 — Filtros do Funil Comercial por Área e Período

## Base preservada

backup-mini-crm-mapa-apos-etapa4B1-funil-volume-orcamentos-funcionando

## Objetivo

Adicionar dois filtros ao funil comercial dentro da aba **Orçamentos**:

- **Área**: usa a coluna P da planilha, importada no CRM como `ramo`.
- **Período**: usa a coluna N da planilha, importada no CRM como `data_emissao`.

## Regra de alçada mantida

- **Vendedor**: consulta somente o ano corrente.
- **Admin**: consulta todos os orçamentos importados.

O filtro de período trabalha dentro da alçada:
- para vendedor, normalmente aparecerá somente o ano corrente;
- para admin, aparecerá a opção **Todos** e os anos encontrados nas emissões.

## Arquivos alterados

Substituir:

```text
components/crm/FunilOrcamentos.tsx
hooks/useFunilOrcamentos.ts
```

## O que foi alterado

1. O hook do funil agora busca também o campo `ramo`.
2. O funil extrai as opções disponíveis de Área a partir de `ramo`.
3. O funil extrai os anos disponíveis a partir de `data_emissao`.
4. Os filtros são aplicados antes do agrupamento dos orçamentos.
5. A UI recebeu dois selects compactos no padrão visual atual:
   - Área
   - Período

## Teste recomendado

```bash
npm run dev
```

Abrir:

```text
CRM > Orçamentos
```

Testar:

1. Área = Todas.
2. Área = Agroindustria.
3. Área = Corrugado.
4. Período = Todos, como admin.
5. Período = 2026, 2025, 2024, conforme dados importados.
6. Confirmar se os cards Abertos, Fechados, Cancelados e Total analisado mudam conforme filtros.

Depois rodar:

```bash
npm run build
```

## Observação técnica

Esta etapa não altera banco, Supabase, importação nem regras de status. Ela apenas usa os campos já importados:

```text
ramo
data_emissao
```

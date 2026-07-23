# Etapa 4B.1 — Funil Comercial por Volume de Orçamentos

## Objetivo

Adicionar o Funil Comercial dentro da aba **Orçamentos**, sem criar nova aba e sem alterar banco.

## Regra de alçada aplicada

- **Vendedor:** considera somente orçamentos do ano corrente.
- **Admin:** considera todos os orçamentos importados.

## Observação técnica importante

O histórico atual de orçamentos do projeto não possui campo monetário de valor total do orçamento.
Por isso, nesta etapa, "volume" foi implementado como **quantidade de orçamentos únicos** agrupados por status.

A regra de agrupamento segue o padrão já usado no relatório de orçamentos abertos:

- Agrupa por cliente/loja + número principal do orçamento.
- A = Aberto
- B = Fechado
- C = Cancelado
- Status final prevalece pela prioridade: B > C > A.

## Arquivos alterados/adicionados

- `app/crm/page.tsx`
- `components/crm/FunilOrcamentos.tsx`
- `hooks/useFunilOrcamentos.ts`

## Como testar

1. Criar backup antes de aplicar:
   `backup-mini-crm-mapa-antes-etapa4B1-funil-volume-orcamentos`

2. Substituir/copiar os arquivos do patch.

3. Rodar:

```bash
npm run dev
```

4. Abrir:

```text
/crm > Orçamentos
```

5. Conferir:
   - bloco **Funil comercial** aparece dentro da aba Orçamentos;
   - vendedor mostra período "Vendedor: ano corrente";
   - admin mostra período "Admin: todos os orçamentos importados";
   - cards Abertos, Fechados e Cancelados aparecem com altura padrão 58px;
   - botão Atualizar funil usa Button padrão;
   - lista de Orçamentos em Aberto continua funcionando abaixo.

6. Depois rodar:

```bash
npm run build
```

## Backup final sugerido

Se funcionar:

`backup-mini-crm-mapa-apos-etapa4B1-funil-volume-orcamentos-funcionando`

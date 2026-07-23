# Etapa 2 — Histórico do Cliente / Programação completa

## Arquivos incluídos

Substituir arquivo inteiro:

- `types/index.ts`
- `components/crm/ClienteModal.tsx`

Criar arquivo novo:

- `hooks/useHistoricoCliente.ts`
- `components/crm/HistoricoCliente.tsx`

Arquivo apenas de referência/registro:

- `supabase/orcamentos_historico.sql`

## Ordem segura

1. Confirmar branch:
   ```bash
   git branch
   ```
   Deve aparecer:
   ```txt
   * historico-cliente-orcamentos
   ```

2. Fazer backup dos arquivos antes de substituir:
   - `types/index.ts`
   - `components/crm/ClienteModal.tsx`

3. Copiar os arquivos desta pasta para a raiz do projeto, mantendo a mesma estrutura de pastas.

4. Rodar:
   ```bash
   npm run typecheck
   npm run lint
   npm run build
   npm run dev
   ```

5. Testar:
   - abrir `http://localhost:3000/crm`
   - abrir um cliente
   - clicar em `Histórico do Cliente`
   - como ainda não importamos planilha, deve aparecer:
     `Ainda não há orçamentos importados para este cliente nos últimos 36 meses.`

## Observação

Esta etapa ainda não importa a planilha. Ela apenas prepara a leitura e a tela do histórico.

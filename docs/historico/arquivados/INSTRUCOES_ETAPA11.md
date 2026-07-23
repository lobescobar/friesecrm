# Etapa 11 — Ajuste fino do modal do cliente conforme SAAS

## Objetivo

Aplicar a nova atualização definida com a SAAS para reduzir repetição visual no modal do cliente.

## Escopo

Esta etapa é somente visual/estrutural.

Não altera:

- Supabase
- banco de dados
- tabelas
- permissões
- importação ERP
- importação de orçamentos
- vínculo cliente/orçamento
- dados salvos

## Mudanças aplicadas

1. Remove a faixa azul escura do corpo do modal.
2. Remove a aba Resumo.
3. O modal abre diretamente na aba Dados.
4. O topo do modal passa a mostrar somente o nome principal do cliente.
5. Remove o subtítulo do topo que mostrava código/endereço.
6. O menu passa a conter somente:
   - Dados
   - Contatos
   - Histórico
   - Mapa
   - Observações
7. A aba Dados passa a exibir:
   - código
   - razão social
   - nome fantasia
   - CNPJ
   - segmento
   - cidade
   - UF
   - endereço
   - status
8. O telefone não aparece na aba Dados.
9. O status continua editável dentro da aba Dados.

## Arquivos para substituir

- components/crm/ClienteModal.tsx
- components/crm/cliente-modal/ClienteModalNav.tsx
- components/crm/cliente-modal/ClienteDados.tsx

## Arquivo que pode continuar no projeto sem uso

- components/crm/cliente-modal/ClienteResumo.tsx

Não é obrigatório apagar esse arquivo agora. Ele apenas deixou de ser chamado pelo modal.

## Como testar

Na branch `historico-cliente-orcamentos`, rode:

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

Depois testar localmente:

1. Abrir um cliente.
2. Confirmar que o topo mostra somente o nome principal do cliente.
3. Confirmar que a faixa azul não aparece mais.
4. Confirmar que não existe aba Resumo.
5. Confirmar que abre direto em Dados.
6. Confirmar que a aba Dados não mostra telefone.
7. Trocar entre Dados, Contatos, Histórico, Mapa e Observações.
8. Clicar em um orçamento no Histórico.
9. Visualizar itens, descrição e quantidade.
10. Alterar status e salvar.
11. Alterar observações e salvar.
12. Testar em mobile/responsivo.

## Commit sugerido

```bash
git status
git add .
git commit -m "Remove repetição visual do modal do cliente"
git push
```

Não fazer merge para `main` antes da validação visual.

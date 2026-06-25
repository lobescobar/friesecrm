# Etapa 14O — Cache e estabilidade ao retornar ao CRM

## Objetivo

Reduzir carregamentos e perda de posição quando o usuário alterna janela, minimiza o navegador ou volta para o CRM.

Esta etapa complementa as etapas anteriores de preservação de navegação.

## O que esta etapa faz

1. Mantém clientes em cache temporário no `sessionStorage`.
2. Mantém contatos do cliente em cache temporário.
3. Mantém histórico do cliente em cache temporário.
4. Mantém orçamentos em aberto em cache temporário.
5. Evita limpar listas enquanto uma atualização em segundo plano está acontecendo.
6. Preserva rolagem do modal principal do cliente.
7. Preserva rolagem da aba interna do cliente.
8. Preserva rolagem do modal de detalhe do orçamento.
9. Mantém a correção de foco do modal.

## Arquivos alterados

Substituir inteiros:

```txt
components/ui/Modal.tsx
components/crm/ClienteModal.tsx
components/crm/HistoricoCliente.tsx
hooks/useClientes.ts
hooks/useContatos.ts
hooks/useHistoricoCliente.ts
hooks/useOrcamentosAbertos.ts
```

Criar arquivo novo:

```txt
utils/sessionCache.ts
```

## Banco de dados

Não executar SQL.

Esta etapa não altera:

```txt
Supabase
tabelas
permissões
importações
ERP
Vercel
```

## Como aplicar

1. Confirme backup antes de copiar.

Nome sugerido:

```txt
backup-mini-crm-mapa-antes-cache-estabilidade-crm-etapa14o
```

2. Copie o conteúdo deste pacote por cima da raiz do projeto.

3. Rode:

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

## Testes obrigatórios

### Teste 1 — Cliente e aba

1. Abra `/crm`.
2. Abra um cliente.
3. Entre na aba Histórico.
4. Role a lista.
5. Minimize o navegador ou alterne para outra janela.
6. Volte para o CRM.
7. O cliente deve continuar aberto.
8. A aba Histórico deve continuar aberta.
9. A rolagem deve permanecer próxima do ponto anterior.

### Teste 2 — Modal de orçamento

1. Abra um cliente.
2. Entre em Histórico.
3. Clique em um orçamento.
4. Role o detalhe do orçamento, se houver rolagem.
5. Minimize ou alterne a janela.
6. Volte ao CRM.
7. O modal do orçamento deve continuar aberto.
8. A rolagem do modal deve ser preservada.

### Teste 3 — Menos carregamento

1. Abra um cliente.
2. Troque entre abas.
3. Volte para o CRM depois de alternar janela.
4. O sistema não deve piscar nem limpar listas antes de atualizar.

## Observação importante

O cache é temporário e fica no navegador, em `sessionStorage`.

Ele não substitui o Supabase.  
Ele apenas melhora estabilidade visual e reduz recarregamentos desnecessários.

Se o navegador descartar totalmente a aba por falta de memória, o sistema ainda pode recarregar a aplicação, mas deve restaurar mais rapidamente o contexto salvo.

## Commit sugerido

```bash
git status
git add components/ui/Modal.tsx components/crm/ClienteModal.tsx components/crm/HistoricoCliente.tsx hooks/useClientes.ts hooks/useContatos.ts hooks/useHistoricoCliente.ts hooks/useOrcamentosAbertos.ts utils/sessionCache.ts INSTRUCOES_ETAPA14O.md
git commit -m "Adiciona cache e preserva estabilidade visual do CRM"
git push origin main
```

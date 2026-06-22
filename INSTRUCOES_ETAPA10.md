# Etapa 10 — Reorganização do Modal do Cliente

## Objetivo

Reorganizar o modal/painel do cliente para reduzir excesso de rolagem e melhorar a localização das informações.

Esta etapa segue a orientação da SaaS:

- não adicionar informações;
- não remover informações;
- não alterar banco de dados;
- não alterar Supabase;
- não alterar regras de importação;
- não alterar permissões;
- não publicar na `main` antes de validação.

A mudança é apenas de layout, organização e navegação interna.

## Arquivos para substituir/criar

### Substituir arquivo inteiro

```txt
components/crm/ClienteModal.tsx
```

### Criar novos arquivos

```txt
components/crm/cliente-modal/ClienteModalHeader.tsx
components/crm/cliente-modal/ClienteModalNav.tsx
components/crm/cliente-modal/ClienteResumo.tsx
components/crm/cliente-modal/ClienteDados.tsx
components/crm/cliente-modal/ClienteObservacoes.tsx
```

## Novo comportamento

Ao clicar em um cliente, o painel passa a ter:

```txt
Cabeçalho do cliente
Menu lateral no desktop
Abas horizontais no mobile
Conteúdo central por seção
```

Seções:

```txt
Resumo
Dados
Contatos
Histórico
Mapa
Observações
```

A seção inicial é:

```txt
Resumo
```

Se o cliente for aberto a partir de um orçamento em aberto, a seção inicial continua sendo:

```txt
Histórico
```

## O que foi mantido

Foram mantidos:

```txt
dados do cliente
ações rápidas
contatos
observações
histórico de orçamentos
detalhes dos itens do orçamento
localização / mapa por link
status
salvamento de status e observações
proteção contra fechar com alteração não salva
```

## Banco de dados

Não executar SQL nesta etapa.

## Como aplicar

Confirme que está na branch correta:

```bash
git branch
```

Deve aparecer:

```txt
* historico-cliente-orcamentos
```

Depois copie os arquivos deste pacote por cima da raiz do projeto.

## Testes obrigatórios

Rode:

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

Depois teste localmente:

```txt
http://localhost:3000/crm
```

Validar:

```txt
1. abrir cliente;
2. confirmar que abre em Resumo;
3. trocar para Dados;
4. trocar para Contatos;
5. trocar para Histórico;
6. clicar em orçamento e visualizar itens;
7. trocar para Mapa;
8. trocar para Observações;
9. alterar observação e salvar;
10. alterar status e salvar;
11. testar largura menor/mobile;
12. confirmar que não há rolagem longa com todas as seções empilhadas.
```

## Commit sugerido

Depois de validar:

```bash
git status
git add .
git commit -m "Reorganiza modal do cliente com navegação por seções"
git push
```

Ainda não fazer merge para `main` antes da validação visual.

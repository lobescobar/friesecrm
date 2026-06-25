# Etapa 14D — Preservar navegação do CRM

## Objetivo

Evitar que o CRM volte para a tela inicial quando o usuário troca de aba, minimiza o navegador, muda de tela ou a página é recarregada.

## O que esta etapa faz

A partir desta etapa, quando o usuário abrir um cliente, o CRM passa a gravar a navegação na URL:

```txt
/crm?cliente=<id>&aba=<dados|contatos|historico|mapa|observacoes>&orcamento=<numero>
```

Com isso, se a tela for recarregada, o CRM consegue restaurar:

- cliente aberto;
- aba selecionada;
- histórico aberto;
- orçamento destacado quando veio do alerta de abertos.

## O que não muda

Esta etapa não altera:

- banco de dados;
- Supabase;
- tabelas;
- importações;
- status de cliente;
- status de orçamento;
- envio de e-mail;
- permissões;
- Vercel diretamente.

## Arquivos alterados

Substituir inteiros:

```txt
app/crm/page.tsx
components/crm/ClienteModal.tsx
components/ui/Modal.tsx
```

O arquivo `components/ui/Modal.tsx` também mantém a correção de foco da Etapa 14C.

## Como aplicar

1. Faça backup antes de substituir:

```txt
backup-mini-crm-mapa-antes-etapa14d-preservar-navegacao
```

2. Copie o conteúdo deste pacote por cima da raiz do projeto.

3. Rode:

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

## Teste local obrigatório

Acesse:

```txt
http://localhost:3000/crm
```

Teste:

1. Abra um cliente.
2. Entre na aba Histórico.
3. Copie a URL ou recarregue a página.
4. O CRM deve voltar para o mesmo cliente na aba Histórico.
5. Troque para Contatos, Mapa ou Observações.
6. Veja se a URL muda para `aba=contatos`, `aba=mapa` ou `aba=observacoes`.
7. Feche o modal.
8. A URL deve voltar para `/crm`.
9. Clique no alerta de orçamentos em aberto.
10. O CRM deve abrir o cliente direto no Histórico e destacar o orçamento.

## Publicação

Se tudo passar:

```bash
git status
git add .
git commit -m "Preserva navegacao do CRM ao retornar para a pagina"
git push origin main
```

## Observação

Esta etapa preserva o estado principal de navegação do cliente. Filtros da tabela, posição exata de rolagem e modal interno de solicitação de cancelamento não foram persistidos nesta primeira versão para evitar complexidade e risco.

# Etapa 14 — Teste de solicitação de cancelamento de orçamento

## Objetivo

Adicionar um fluxo de teste para solicitar cancelamento de orçamentos em aberto.

Nesta primeira versão, o CRM **não envia e-mail automaticamente pelo servidor** e **não altera o status no banco/ERP**.

O sistema abre um e-mail pronto para envio ao endereço:

```txt
vendas.ai@friese.com.br
```

O usuário logado deve conferir e clicar em enviar no aplicativo de e-mail.

## Regra aplicada

A ação aparece somente para orçamentos com status:

```txt
Aberto
```

Ao clicar em **Solicitar cancelamento**, abre uma tela solicitando o motivo.

Depois de confirmar, o e-mail é preparado com:

```txt
Favor cancelar o orçamento a seguir.

Número do orçamento: [número]
Vendedor/Solicitante CRM: [e-mail do usuário logado]
Motivo: [motivo informado]

Solicitação enviada pelo Painel de Gestão Comercial.
```

## Arquivo alterado

Substituir inteiro:

```txt
components/crm/HistoricoCliente.tsx
```

## Não altera

```txt
Supabase
banco de dados
tabelas
status do orçamento
status do cliente
importações
permissões
```

## Testes

Rodar:

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

Depois testar:

```txt
1. Abrir cliente
2. Ir em Histórico
3. Localizar orçamento Aberto
4. Clicar em Solicitar cancelamento
5. Informar motivo
6. Clicar em Preparar e-mail
7. Conferir se o e-mail abre para vendas.ai@friese.com.br
8. Confirmar se o corpo contém número do orçamento, solicitante e motivo
```

## Commit sugerido

```bash
git status
git add .
git commit -m "Adiciona solicitacao de cancelamento de orcamento por email"
git push origin main
```

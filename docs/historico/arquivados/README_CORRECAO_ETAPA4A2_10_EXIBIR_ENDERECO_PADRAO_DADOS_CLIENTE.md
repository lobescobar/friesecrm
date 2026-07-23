# Etapa 4A.2.10 — Exibir endereço padrão na ficha do cliente

## Objetivo

Depois da criação do campo `endereco_padrao` em `contatos_clientes`, esta correção passa a exibir o endereço padrão diretamente na aba **Dados** do cliente.

## Arquivos alterados

- `components/crm/ClienteModal.tsx`
- `components/crm/cliente-modal/ClienteDados.tsx`

## O que muda

- A aba **Dados** passa a mostrar o card **Endereço padrão de visita**.
- Quando existe contato marcado como padrão, o endereço exibido vem de `contatos_clientes.endereco_visita`.
- Quando não existe contato padrão, o CRM mantém fallback seguro usando o endereço do cadastro ERP.
- O endereço do ERP continua visível, agora com o rótulo **Endereço ERP**, para não confundir com o endereço de visita.

## O que não muda

- Não altera banco.
- Não altera regra de cálculo de status.
- Não altera importação ERP.
- Não altera mapa geral.
- Não altera Supabase/RLS.

## Backup recomendado

Antes de aplicar:

`backup-mini-crm-mapa-antes-etapa4A2-10-exibir-endereco-padrao-dados-cliente`

Depois de testar e funcionar:

`backup-mini-crm-mapa-apos-etapa4A2-10-exibir-endereco-padrao-dados-cliente-funcionando`

## Testes

1. Abrir cliente com contato marcado como padrão.
2. Entrar na aba **Dados**.
3. Conferir o card **Endereço padrão de visita**.
4. Conferir se a origem aparece como `Contato padrão: nome`.
5. Abrir cliente sem contato padrão e confirmar fallback para **Cadastro ERP**.
6. Conferir se a aba **Contatos** continua permitindo alterar o padrão.

# Etapa 4A.2 — Padronização oficial de botões

Projeto: Mini CRM Mapa / Painel Comercial Friese Agroindústria

## Backup obrigatório antes de aplicar

Preservar:

`backup-mini-crm-mapa-apos-etapa3d-refatoracao-page-crm-funcionando`

Criar novo backup antes de substituir os arquivos:

`backup-mini-crm-mapa-antes-etapa4A2-padrao-botoes`

## Arquivos ajustados nesta etapa

- `components/ui/Button.tsx`
- `docs/PADRAO_BOTOES_CRM.md`
- `app/components/ErrorBoundary.tsx`
- `app/login/page.tsx`
- `app/reset-senha/page.tsx`
- `components/crm/cliente-modal/ClienteResumo.tsx`
- `components/crm/ContatosCliente.tsx`
- `components/crm/MapaClientes.tsx`
- `components/ui/Modal.tsx`

## O que foi aplicado

- Padronização de botões comuns usando `components/ui/Button.tsx`.
- Uso de `variant`, `size`, `loading` e `loadingText`.
- Ações principais com `primary`.
- Ações neutras/discretas com `secondary` ou `ghost`.
- Ação destrutiva de contato com `danger`.
- Documentação oficial criada em `docs/PADRAO_BOTOES_CRM.md`.

## Botões manuais que permaneceram de propósito

Alguns `<button>` foram preservados por serem controles visuais específicos, não botões comuns:

- navegação em cards;
- filtros em cards de resumo;
- ordenação de tabela;
- botão de mostrar/ocultar senha dentro do input;
- estados desabilitados sem ação;
- botões que funcionam como link textual interno.

Eles devem ser revisados em etapas futuras específicas para navegação, cards e tabelas.

## Validação feita

- `npm run typecheck`: passou.
- `npm run lint`: passou.
- `npm run build`: não pôde ser concluído neste ambiente porque o zip trouxe `node_modules` do Windows (`@next/swc-win32-x64-msvc`) e o ambiente de validação é Linux. O Next tentou baixar `@next/swc-linux-x64-gnu`, mas não há acesso ao registry neste sandbox.

## Como validar localmente

No seu computador, dentro da pasta do projeto:

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

## Teste visual recomendado

Abrir e conferir:

- tela de login;
- tela de reset de senha;
- erro/recarregar página;
- modal do cliente;
- resumo do cliente;
- contatos do cliente, editar e excluir;
- popup do mapa;
- fechamento de modais.

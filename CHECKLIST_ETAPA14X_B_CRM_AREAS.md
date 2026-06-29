# Etapa 14X-B — Reorganização da tela /crm por áreas

Data: 2026-06-26

## Objetivo

Reduzir rolagem, tirar o mapa da posição central da página e organizar o CRM por áreas de trabalho, mantendo regras de negócio, banco, importações, auditoria e permissões já validadas.

## Áreas criadas na navegação interna

- Visão geral
- Clientes
- Mapa
- Orçamentos
- Administração
- Auditoria

## Arquivos alterados

- app/crm/page.tsx
- app/login/page.tsx
- components/crm/AlertaOrcamentosAbertos.tsx

## O que mudou

- A tela /crm deixou de exibir todas as funcionalidades empilhadas.
- Foi criada navegação por áreas com botões grandes e responsivos.
- A Visão geral ficou limpa, sem indicadores e sem cards repetidos abaixo da navegação.
- Clientes concentra indicadores, filtros e lista/tabela.
- Mapa passou a ter área própria.
- Orçamentos em aberto passaram a ter área própria.
- Administração e Auditoria continuam restritas a admin.
- AlertaOrcamentosAbertos agora aceita `mostrarVazio` para exibir estado vazio na área dedicada.
- O login mantém somente o texto "Plataforma comercial" abaixo do logo.

## O que não mudou

- Regras de negócio.
- Supabase.
- Importação ERP.
- Importação de orçamentos.
- Auditoria 14V.
- Controle admin/vendedor.
- Mapa e geolocalização existentes.
- Modal do cliente.

## Testes obrigatórios

```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .turbo -ErrorAction SilentlyContinue
npm run lint
npm run typecheck
npm run build
npm run dev
```

## Checklist funcional

- Login admin funciona.
- Login vendedor funciona.
- /crm abre.
- Visão geral aparece.
- Clientes abre filtros e lista.
- Mapa abre em área própria.
- Orçamentos abre em área própria.
- Administração aparece apenas para admin.
- Auditoria aparece apenas para admin.
- Vendedor não vê Administração nem Auditoria.
- Modal do cliente continua abrindo.
- Histórico a partir de orçamento em aberto continua funcionando.
- Celular: navegação por áreas fica usável.
- Celular: mapa não atrapalha a rolagem da tela principal.

## Observação

Se aparecer erro de hydration após substituir arquivos, limpar `.next` e `.turbo`, reiniciar o servidor e atualizar o navegador com Ctrl+Shift+R.

## Ajuste 14X-B.1

- Removidos os cards/atalhos repetidos da Visão geral.
- Os indicadores `Clientes cadastrados`, `Exibidos nos filtros`, `Com localização` e `Ativos` agora aparecem somente na área Clientes.
- A Visão geral passou a orientar o usuário a escolher uma área de trabalho pela navegação superior.

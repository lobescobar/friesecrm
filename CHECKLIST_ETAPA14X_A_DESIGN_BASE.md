# Etapa 14X-A — Base visual, login e componentes básicos

Data: 2026-06-26

## Objetivo

Criar a primeira camada de padronização visual do Mini CRM Mapa / CRM Friese, com foco em identidade industrial, acessibilidade, botões, campos, cards e tela de login.

## Alterações aplicadas

- `app/globals.css`
  - tokens visuais da marca Friese;
  - fundo industrial claro;
  - foco visível para acessibilidade;
  - padrões reutilizáveis: `crm-card`, `crm-field`, `crm-label`, `crm-section-title`;
  - scrollbar mais discreta.

- `app/login/page.tsx`
  - visual mais industrial e profissional;
  - substituição do emoji de senha por ícone SVG limpo;
  - área clicável maior para mostrar/ocultar senha;
  - campos com foco mais claro;
  - botão principal com padrão Friese;
  - melhor responsividade.

- `components/ui/Button.tsx`
  - botões com altura mínima confortável;
  - foco visível;
  - variantes com visual mais consistente.

- `components/ui/BadgeStatus.tsx`
  - badge com peso visual mais consistente.

- `components/crm/CrmHeader.tsx`
  - cabeçalho com hierarquia visual mais clara;
  - melhor organização em telas menores.

- `components/crm/ResumoIndicadores.tsx`
  - cards mais consistentes;
  - subtítulos de contexto;
  - destaque visual discreto com âmbar.

- `components/crm/FiltrosClientes.tsx`
  - campos usando padrão visual global;
  - labels mais consistentes.

- `components/crm/ClienteCardMobile.tsx`
  - card mobile alinhado à nova base visual.

## O que não foi alterado

- regras de negócio;
- Supabase;
- importações;
- auditoria;
- mapa;
- permissão admin/vendedor;
- estrutura geral da página `/crm`.

## Testes recomendados

```powershell
npm run lint
npm run typecheck
npm run build
npm run dev
```

Depois validar:

- login admin;
- login vendedor;
- tela `/crm`;
- cards de indicadores;
- filtros;
- lista de clientes em desktop;
- lista de clientes em celular;
- auditoria admin;
- vendedor comum sem auditoria.

## Próxima etapa

Etapa 14X-B — reorganização da tela `/crm` por áreas:

- Visão geral;
- Clientes;
- Mapa;
- Orçamentos;
- Administração;
- Auditoria.

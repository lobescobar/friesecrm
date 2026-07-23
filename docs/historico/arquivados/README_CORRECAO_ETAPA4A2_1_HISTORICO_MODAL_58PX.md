# Correção visual — Etapa 4A.2.1

Projeto: Mini CRM Mapa / Painel Comercial Friese Agroindústria

## Objetivo

Correção fina da tela de Histórico do Cliente após a padronização oficial de botões.

Esta correção não altera banco, Supabase, importação, cálculo de histórico, filtros ou regra de negócio.

## Backup obrigatório antes de aplicar

Preservar:

`backup-mini-crm-mapa-apos-etapa4A2-padrao-botoes-funcionando`

Criar novo backup antes de substituir:

`backup-mini-crm-mapa-antes-etapa4A2-1-ajuste-historico-modal-58px`

## Arquivos alterados

- `components/crm/historico/HistoricoResumoCards.tsx`
- `components/crm/historico/TabelaHistoricoOrcamentos.tsx`
- `components/crm/ClienteModal.tsx`
- `components/ui/Modal.tsx`

## Ajustes aplicados

### Cards Total / Abertos / Fechados / Cancelados

Arquivo:

`components/crm/historico/HistoricoResumoCards.tsx`

Ajuste:

- altura fixa de `58px`;
- padding reduzido proporcionalmente;
- número reduzido de `text-2xl` para `text-xl`;
- foco acessível com destaque dourado Friese;
- `aria-label` descritivo para cada filtro.

### Botão Histórico da tabela

Arquivo:

`components/crm/historico/TabelaHistoricoOrcamentos.tsx`

Ajuste:

- `size="sm"` aplicado;
- mantém ação visual primária, porém compacta;
- versão mobile também usa `size="sm"` e `fullWidth`.

### Botões Fechar e Salvar alterações do modal

Arquivo:

`components/crm/ClienteModal.tsx`

Ajuste:

- `size="sm"` nos botões do rodapé;
- `Salvar alterações` passa a usar `loading` e `loadingText="Salvando..."`.

### Rodapé do modal

Arquivo:

`components/ui/Modal.tsx`

Ajuste:

- padding vertical reduzido de `py-4` para `py-3`, preservando espaçamento e acessibilidade.

## Como validar

Rode:

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

Teste em:

```text
/crm
Abrir cliente
Aba Histórico
```

Conferir:

- cards Total/Abertos/Fechados/Cancelados com altura compacta de 58px;
- botão Histórico da linha menor;
- botões Fechar e Salvar alterações menores no rodapé;
- filtro por status continua funcionando;
- salvar observações continua funcionando;
- modal continua fechando pelo X, Fechar e Escape quando permitido.

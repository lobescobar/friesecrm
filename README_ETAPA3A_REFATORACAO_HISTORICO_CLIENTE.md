# Etapa 3A — Refatoração segura do Histórico do Cliente

Esta etapa reorganiza o arquivo grande `components/crm/HistoricoCliente.tsx` sem mudar regra de negócio.

## Backup antes de aplicar

Mantenha intacto:

```text
backup-mini-crm-mapa-apos-etapa2-acessibilidade-funcionando
```

## Arquivos para substituir ou adicionar

Substituir:

```text
components/crm/HistoricoCliente.tsx
```

Adicionar:

```text
components/crm/historico/HistoricoResumoCards.tsx
components/crm/historico/HistoricoFiltros.tsx
components/crm/historico/TabelaHistoricoOrcamentos.tsx
components/crm/historico/ModalItensOrcamento.tsx
components/crm/historico/ModalHistoricoOrcamento.tsx
components/crm/historico/ModalCancelamentoOrcamento.tsx
hooks/useInteracoesOrcamento.ts
types/historico.ts
utils/historicoOrcamentos.ts
utils/cancelamentoOrcamentos.ts
```

## O que mudou internamente

```text
- A tabela de histórico foi separada em TabelaHistoricoOrcamentos.
- Os cards de resumo foram separados em HistoricoResumoCards.
- Os filtros foram separados em HistoricoFiltros.
- O modal de itens foi separado em ModalItensOrcamento.
- O modal de histórico manual foi separado em ModalHistoricoOrcamento.
- O modal de cancelamento foi separado em ModalCancelamentoOrcamento.
- A busca/salvamento de interações foi para hooks/useInteracoesOrcamento.ts.
- Agrupamento, ordenação e formatação foram para utils/historicoOrcamentos.ts.
- E-mails de cancelamento foram para utils/cancelamentoOrcamentos.ts.
- Tipos específicos foram para types/historico.ts.
```

## O que não deve mudar para o usuário

```text
- A aba Histórico continua no mesmo lugar.
- O número do orçamento continua abrindo os itens.
- O botão Histórico continua abrindo o histórico manual do orçamento.
- A solicitação de cancelamento continua preparando o e-mail.
- Filtros e ordenação continuam funcionando.
- Registros manuais continuam salvando na tabela orcamentos_interacoes.
```

## Teste obrigatório

Depois de copiar os arquivos:

```bash
npm run build
npm run dev
```

Teste:

```text
1. Abrir /crm
2. Abrir um cliente
3. Ir em Histórico
4. Ordenar por Orçamento, Emissão, Pedido de venda e Data de fechamento
5. Filtrar por Total, Abertos, Fechados e Cancelados
6. Clicar no número do orçamento e confirmar que abre os itens
7. Clicar em Histórico e salvar um registro manual
8. Fechar e abrir novamente o Histórico do orçamento
9. Confirmar que o registro salvo aparece
10. Solicitar cancelamento em um orçamento aberto e confirmar que o e-mail é preparado
```

## Publicação

Se tudo passar:

```bash
git status
git add .
git commit -m "Etapa 3A refatora historico do cliente"
git push origin main
```

Depois da publicação funcionar:

```text
backup-mini-crm-mapa-apos-etapa3a-historico-refatorado-funcionando
```

# Etapa 4A.2.11 — Aviso de endereço padrão com 58px

## Objetivo
Padronizar o aviso/card **Endereço padrão de visita** na aba **Dados** do cliente para o padrão visual compacto de 58px.

## Arquivo alterado
- `components/crm/cliente-modal/ClienteDados.tsx`

## Alteração aplicada
O bloco do endereço padrão foi ajustado para:

- altura fixa `h-[58px]`;
- layout horizontal com texto à esquerda e selo `Padrão` à direita;
- textos com `truncate` para não aumentar a altura do card;
- padding horizontal compacto;
- preservação da lógica atual de endereço padrão:
  - usa `contatoEnderecoPadrao.endereco_visita` quando existir;
  - usa o endereço do cadastro ERP como fallback.

## Backup recomendado antes de aplicar
`backup-mini-crm-mapa-antes-etapa4A2-11-aviso-endereco-padrao-58px`

## Teste recomendado
1. Rodar `npm run dev`.
2. Abrir um cliente.
3. Entrar na aba **Dados**.
4. Confirmar que o aviso **Endereço padrão de visita** está com altura compacta de 58px.
5. Conferir cliente com endereço padrão de contato.
6. Conferir cliente sem endereço padrão, usando fallback do cadastro ERP.
7. Rodar `npm run build` no computador local.

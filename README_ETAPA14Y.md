# Etapa 14Y - Regras editáveis de cancelamento de orçamentos

## Objetivo

Permitir que o painel Administração mostre todos os e-mails cadastrados e, abaixo de cada e-mail, os segmentos em que ele atua.

Exemplo:

vendas.cr@friese.com.br
[x] Corrugados
[ ] Automotivo
[ ] Embalagens
[ ] Outros

vendas.ai@friese.com.br
[ ] Corrugados
[x] Automotivo
[x] Embalagens
[x] Outros

## Regra de negócio

1. Cada segmento pode atuar em apenas um e-mail.
2. Cada e-mail pode atuar em vários segmentos.
3. Todos os e-mails exibem o seletor completo de segmentos.
4. Corrugados aparece no seletor de todos os e-mails.
5. Se um segmento for marcado em outro e-mail, ele é transferido automaticamente.
6. Se não houver regra específica, o CRM usa o e-mail marcado como padrão.
7. Se houver erro na consulta ao banco, o fallback seguro permanece:
   - Corrugados -> vendas.cr@friese.com.br
   - Demais segmentos -> vendas.ai@friese.com.br

## Ordem de instalação

1. Fazer backup:
   backup-mini-crm-mapa-etapa14Y-antes-regras-cancelamento-editaveis

2. Executar no Supabase SQL Editor:
   sql/etapa14Y-regras-cancelamento-orcamentos.sql

3. Substituir/criar arquivos:
   components/crm/HistoricoCliente.tsx
   components/crm/GestaoUsuarios.tsx
   components/crm/admin/RegrasCancelamentoOrcamentos.tsx

4. Rodar:
   npm run lint
   npm run typecheck
   npm run build
   npm run dev

## Testes

1. Entrar como admin.
2. Acessar CRM > Administração.
3. Ver a área "Regras de cancelamento de orçamentos".
4. Confirmar que aparecem vendas.cr@friese.com.br e vendas.ai@friese.com.br.
5. Confirmar Corrugados marcado em vendas.cr@friese.com.br.
6. Confirmar demais segmentos usando o e-mail padrão vendas.ai@friese.com.br.
7. Marcar Corrugados em outro e-mail e confirmar que sai do anterior.
8. Cadastrar novo e-mail e marcar segmentos nele.
9. Abrir orçamento de cliente Corrugados e preparar e-mail.
10. Abrir orçamento de outro segmento e preparar e-mail.

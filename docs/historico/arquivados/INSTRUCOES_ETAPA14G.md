# Etapa 14G — Preservar modal de detalhes do orçamento ao trocar de janela

## Problema corrigido

Quando o usuário estava no detalhe de um orçamento, minimizava ou trocava de janela e depois voltava para o CRM, o modal secundário do orçamento fechava e o sistema voltava para a aba Histórico do cliente.

## Causa

O cliente e a aba já estavam sendo preservados na URL/sessionStorage, mas o modal secundário de orçamento ainda dependia de estado local interno (`orcamentoDetalhado`). Ao ocorrer foco/visibilidade/remontagem, esse estado podia ser perdido.

## Correção aplicada

Agora o orçamento detalhado também é controlado pela navegação do CRM:

- ao clicar em um orçamento, a URL recebe `orcamento=NUMERO`;
- ao voltar para a janela, o sistema restaura cliente, aba e orçamento;
- ao fechar o modal do orçamento, o parâmetro `orcamento` é removido;
- o `ClienteModal` não é mais remontado a cada mudança de orçamento;
- a atualização da URL ocorre fora do `setState`, evitando o erro do Router.

## Arquivos alterados

Substituir inteiros:

```txt
app/crm/page.tsx
components/crm/ClienteModal.tsx
components/crm/HistoricoCliente.tsx
```

## Como aplicar

Copie o conteúdo deste pacote por cima da raiz do projeto.

Depois rode:

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

## Teste obrigatório

1. Abra o CRM local.
2. Abra um cliente.
3. Entre em Histórico.
4. Clique em um orçamento.
5. Confirme que a URL contém `cliente=`, `aba=historico` e `orcamento=`.
6. Minimize ou troque para outra janela.
7. Volte para o CRM.
8. O modal do orçamento deve continuar aberto.
9. Feche o modal do orçamento.
10. A URL deve manter cliente e aba, mas remover `orcamento`.
11. Feche o cliente.
12. A URL deve voltar para `/crm`.

## Commit sugerido

```bash
git status
git add app/crm/page.tsx components/crm/ClienteModal.tsx components/crm/HistoricoCliente.tsx
git commit -m "Preserva detalhe do orçamento ao retornar para o CRM"
git push origin main
```

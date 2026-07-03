# Etapa 2A — Acessibilidade base

Arquivos incluídos:

- components/ui/Modal.tsx
- components/ui/Button.tsx
- components/crm/ContatosCliente.tsx

## O que foi ajustado

### Modal

- Adicionado `aria-labelledby` no título do modal.
- Adicionado `aria-describedby` quando existir subtítulo.
- Backdrop deixou de ser botão focável.
- Adicionado controle de foco ao abrir e ao fechar o modal.
- Adicionado ciclo de foco com Tab e Shift+Tab dentro do modal.
- Mantido fechamento pelo Escape quando não houver bloqueio por alterações não salvas.
- Melhorado `aria-label` do botão fechar.

### Button

- Definido `type="button"` como padrão para reduzir risco de submit acidental.
- Adicionado suporte opcional a `loading` e `loadingText`.
- Adicionado `aria-busy` quando o botão estiver em processamento.
- Mantida a compatibilidade com os usos atuais.

### ContatosCliente

- Inputs de contato agora têm labels visíveis.
- Campos de edição também têm labels visíveis.
- Mensagens de erro/sucesso usam `role="alert"` ou `role="status"`.
- Estado de carregamento usa `role="status"`.
- Botões por ícone receberam `aria-label` específico por contato.
- Links de WhatsApp/e-mail receberam foco visual padronizado.
- O contador de contatos recebeu descrição acessível.

## Como testar

1. Substituir os arquivos nos caminhos correspondentes.
2. Rodar `npm run build`.
3. Rodar `npm run dev`.
4. Abrir `/crm`.
5. Abrir um cliente.
6. Abrir a aba Contatos.
7. Testar cadastro, edição e exclusão de contato.
8. Testar Tab e Shift+Tab dentro de um modal.
9. Confirmar que o modal fecha pelo Escape quando permitido.
10. Confirmar que o botão fechar do modal devolve o foco para o ponto anterior.

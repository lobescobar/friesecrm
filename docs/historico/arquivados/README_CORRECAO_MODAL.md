# Correção Modal - não fechar ao clicar fora

Substitua:
components/ui/Modal.tsx

Alteração:
- O fundo escuro do modal continua existindo.
- Clique fora do modal não fecha mais a janela.
- O X continua fechando.
- Escape continua fechando quando não houver bloqueio de alterações não salvas.
- Tab e Shift+Tab continuam presos dentro do modal.

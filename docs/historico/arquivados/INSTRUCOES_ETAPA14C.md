# Etapa 14C — Correção de foco no modal de cancelamento

## Problema corrigido

Ao digitar o motivo do cancelamento, o campo perdia o foco a cada letra digitada.

## Causa

O componente `Modal` focava o botão de fechar sempre que o componente recebia uma nova função `onClose`.
Como o formulário de cancelamento atualiza estado a cada tecla, o modal renderizava novamente e o foco voltava para o botão de fechar.

## Solução

Alterado o arquivo:

```txt
components/ui/Modal.tsx
```

Agora o botão de fechar recebe foco somente na abertura inicial do modal.
As funções de fechamento continuam atualizadas por `ref`, sem roubar o foco do textarea.

## Como aplicar

Copie o conteúdo deste pacote por cima da raiz do projeto.

## Testar

Rode:

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

Depois teste:

1. Abrir um cliente.
2. Ir em Histórico.
3. Abrir um orçamento Aberto.
4. Clicar em Solicitar cancelamento.
5. Digitar uma frase inteira no campo Motivo.
6. Confirmar que o campo não perde mais o foco.
7. Testar ESC para fechar o modal.
8. Testar botão Fechar/Voltar.

## Commit sugerido

```bash
git status
git add .
git commit -m "Corrige foco ao digitar motivo de cancelamento"
git push origin main
```

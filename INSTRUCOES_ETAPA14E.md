# Etapa 14E — Correção do erro de navegação/Router

## Problema corrigido

Após aplicar a Etapa 14D, o Next.js exibiu o erro:

```txt
Cannot update a component (`Router`) while rendering a different component (`CRMContent`)
```

A causa era a chamada a `window.history.replaceState(...)` dentro de uma função de atualização de estado (`setNavegacaoCRM`). No React/Next mais recente, esse tipo de efeito colateral dentro do updater pode ser executado durante o ciclo de renderização e gerar erro.

## Arquivo corrigido

Substituir inteiro:

```txt
app/crm/page.tsx
```

## O que mudou

A atualização da URL agora acontece fora do updater do `setState`.

Antes:

```txt
setNavegacaoCRM(() => {
  window.history.replaceState(...)
  return ...
})
```

Depois:

```txt
window.history.replaceState(...)
setNavegacaoCRM(...)
```

## Como testar

Depois de copiar o arquivo por cima do projeto, rode:

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

Teste:

1. Abrir `/crm`.
2. Abrir um cliente.
3. Trocar para a aba Histórico.
4. Recarregar a página.
5. Confirmar que o cliente e a aba continuam abertos.
6. Fechar o modal.
7. Confirmar que a URL volta para `/crm`.
8. Confirmar que o erro do Router não aparece mais.

## Commit sugerido

```bash
git status
git add app/crm/page.tsx
git commit -m "Corrige atualizacao da URL ao preservar navegacao do CRM"
git push origin main
```

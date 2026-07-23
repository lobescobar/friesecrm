# Etapa 4A.2.4 — Botão Histórico com fonte 14px

## Arquivo alterado

- `components/crm/historico/TabelaHistoricoOrcamentos.tsx`

## Ajustes aplicados

- Botão `Histórico` da tabela recebeu `className="text-sm"`, equivalente a 14px no Tailwind.
- Botão `Histórico` da versão mobile também recebeu `className="text-sm"`.
- Cabeçalhos da tabela foram mantidos no padrão compacto:
  - `Data de emissão` -> `Emissão`
  - `Pedido de venda` -> `Pedido`
  - `Data de fechamento` -> `Fechamento`
- Setas de ordenação permanecem ao lado do texto com `inline-flex`, `gap-1`, `whitespace-nowrap` e `leading-none`.

## Como aplicar

Substituir o arquivo inteiro:

`components/crm/historico/TabelaHistoricoOrcamentos.tsx`

## Teste

1. Parar o servidor.
2. Limpar cache se necessário: `Remove-Item -Recurse -Force .next`
3. Rodar `npm run dev`.
4. Abrir cliente > aba Histórico.
5. Conferir botão Histórico com fonte 14px e cabeçalhos compactos.

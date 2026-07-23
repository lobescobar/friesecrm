# Correção Etapa 4A.2.3 — Cabeçalho da tabela Histórico

Arquivo alterado:

- `components/crm/historico/TabelaHistoricoOrcamentos.tsx`

Alterações:
- `Data de emissão` virou `Emissão`.
- `Pedido de venda` virou `Pedido`.
- `Data de fechamento` virou `Fechamento`.
- As setas de ordenação ficam ao lado do texto usando `inline-flex`, `gap-1` e `whitespace-nowrap`.
- Mantida a lógica de ordenação existente, sem alteração de regra de negócio.

Teste:
1. Substituir o arquivo no projeto.
2. Parar o servidor (`Ctrl + C`).
3. Limpar `.next` se necessário.
4. Rodar `npm run dev`.
5. Abrir o cliente na aba Histórico e conferir o cabeçalho.

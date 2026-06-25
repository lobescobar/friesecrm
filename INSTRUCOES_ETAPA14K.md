# Etapa 14K — Importação de orçamentos por colunas fixas

## Motivo

A importação de orçamentos ainda falhava ao tentar localizar o cabeçalho da planilha:

> Não foi possível encontrar o cabeçalho da planilha de orçamentos.

Como o relatório do ERP possui posições fixas, a importação passa a usar as colunas diretamente, sem depender do texto do cabeçalho.

## Mapeamento oficial aplicado

- Coluna A — Numero It
- Coluna B — Cliente
- Coluna C — Loja
- Coluna F — Descricao
- Coluna G — Quantidade
- Coluna J — Status
- Coluna L — Pedido Venda
- Coluna M — Fechamento
- Coluna N — DT Emissao

## Arquivo alterado

Substituir inteiro:

```txt
components/crm/ImportarOrcamentos.tsx
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

## Teste

1. Acesse o CRM local.
2. Clique em Importar Orçamentos.
3. Selecione a planilha `Orçamentos 24-06.xlsx`.
4. Confirme que a leitura mostra linhas, itens válidos e orçamentos.
5. Confirme a importação.
6. Abra um cliente e confira o histórico.

## Commit sugerido

```bash
git status
git add components/crm/ImportarOrcamentos.tsx
git commit -m "Fixa mapeamento por colunas na importacao de orcamentos"
git push origin main
```

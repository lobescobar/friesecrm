# Etapa 14J — Corrigir reconhecimento do cabeçalho da importação de orçamentos

## Problema corrigido

Ao importar a planilha de orçamentos, o CRM exibiu:

```txt
Não foi possível encontrar o cabeçalho da planilha de orçamentos.
```

A planilha analisada tem o cabeçalho correto na linha 4:

```txt
Numero It | Cliente | Loja | Nome | Produto | Descricao | Quantidade | ... | Status | Pedido Venda | Fechamento | DT Emissao
```

O importador foi ajustado para reconhecer cabeçalhos de forma mais robusta, ignorando acentos, pontos, espaços e variações pequenas.

## Arquivo alterado

```txt
components/crm/ImportarOrcamentos.tsx
```

## Ajustes adicionais

Também foi removido `updated_at` das atualizações da tabela `clientes` dentro do importador de orçamentos, porque o banco informou anteriormente que essa coluna não existe na tabela `clientes`.

## Como aplicar

1. Copie o conteúdo deste pacote por cima da raiz do projeto.
2. Rode:

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

3. Reimporte a planilha de orçamentos.
4. Confira se o resumo da leitura mostra linhas válidas.
5. Confirme a importação.

## Teste esperado

A importação deve reconhecer o cabeçalho e preencher:

- Linhas lidas
- Itens válidos
- Orçamentos
- Abertos
- Fechados
- Cancelados

## Commit sugerido

```bash
git status
git add components/crm/ImportarOrcamentos.tsx
git commit -m "Corrige reconhecimento do cabecalho na importacao de orcamentos"
git push origin main
```

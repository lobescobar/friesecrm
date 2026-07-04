# Etapa 3C — Refatoração segura da Importação de Orçamentos

## Objetivo

Organizar o arquivo `components/crm/ImportarOrcamentos.tsx`, separando a interface, tipos, utilitários e funções de importação, sem alterar a regra de negócio.

## Arquivos incluídos

```text
components/crm/ImportarOrcamentos.tsx
components/crm/importar-orcamentos/ImportarOrcamentosSelecionarPlanilha.tsx
components/crm/importar-orcamentos/ImportarOrcamentosMensagens.tsx
components/crm/importar-orcamentos/ImportarOrcamentosColunas.tsx
components/crm/importar-orcamentos/ImportarOrcamentosResumo.tsx
components/crm/importar-orcamentos/ImportarOrcamentosPrevia.tsx
components/crm/importar-orcamentos/ImportarOrcamentosResultado.tsx
lib/importacaoOrcamentos.ts
types/importacaoOrcamentos.ts
utils/importacaoOrcamentos.ts
```

## Regras preservadas

```text
A = Numero It
B = Cliente
C = Loja
F = Descricao
G = Quantidade
J = Status
L = Pedido Venda
M = Fechamento
N = DT Emissao
```

Também foram preservadas:

```text
- Status A, B e C são importados.
- Status D é desconsiderado.
- Orçamentos fora do período de histórico são ignorados.
- Cliente é localizado por codigo_cliente_loja.
- Upsert continua usando codigo_cliente_loja + numero_it_completo.
- Status dos clientes continua sendo recalculado após a importação.
- Auditoria continua registrando importacao_orcamentos.
```

## Como aplicar

1. Manter backup intacto:

```text
backup-mini-crm-mapa-apos-etapa3b-refatoracao-importar-erp-funcionando
```

2. Copiar os arquivos para os caminhos correspondentes.

3. Rodar:

```bash
npm run build
npm run dev
```

## Teste obrigatório

```text
1. Abrir /crm
2. Clicar em Importar Orçamentos
3. Selecionar a planilha de orçamentos
4. Conferir resumo da leitura
5. Conferir prévia dos primeiros registros válidos
6. Confirmar importação
7. Verificar se os orçamentos aparecem no histórico do cliente
8. Verificar se Orçamentos em aberto continua correto
9. Verificar se Auditoria registrou importacao_orcamentos
```

## Publicação

Depois dos testes:

```bash
git status
git add .
git commit -m "Etapa 3C refatora importacao de orcamentos"
git push origin main
```

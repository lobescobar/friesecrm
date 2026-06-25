# Etapa 14H — Corrigir cidade na importação ERP

## Correção

O campo `cidade` passa a ser lido prioritariamente da **coluna J** da planilha de cadastro de clientes.

A coluna I (`Cd.Municipio`) contém código do município e não deve preencher o campo Cidade.

## Arquivo alterado

Substituir inteiro:

```txt
components/crm/ImportarERP.tsx
```

## Banco de dados

Não é necessário executar SQL.

Para corrigir os clientes que já foram importados com código no lugar da cidade, reimporte a planilha:

```txt
Relação de Clientes.xlsx
```

O importador fará `upsert` e atualizará o campo `cidade`.

## Testes obrigatórios

Após copiar o pacote por cima do projeto:

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

Depois teste localmente:

1. Acesse `/crm`.
2. Importe novamente a planilha `Relação de Clientes.xlsx`.
3. Pesquise um cliente.
4. Confirme que a coluna Cidade exibe o nome da cidade, por exemplo `ITABERAI - GO`, não o código do município.
5. Confira os filtros e o modal do cliente.

## Commit sugerido

```bash
git status
git add components/crm/ImportarERP.tsx
git commit -m "Corrige cidade da importacao ERP para coluna J"
git push origin main
```

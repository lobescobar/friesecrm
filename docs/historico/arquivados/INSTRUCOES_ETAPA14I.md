# Etapa 14I — Correção estrita da cidade pela coluna J

## Problema
A importação de clientes estava gravando a coluna Cidade com o código do município, por exemplo:

- 18800 - SP
- 15200 - PR
- 70206 - MG

Isso ocorre quando o importador encontra o cabeçalho `Cd.Municipio` antes de `Municipio`.

## Regra oficial
Na planilha `Relação de Clientes.xlsx`:

- Coluna I = Cd.Municipio (código numérico, NÃO usar como cidade)
- Coluna J = Municipio (nome da cidade, usar como cidade)
- Coluna H = Estado

## Arquivo alterado
Substituir inteiro:

components/crm/ImportarERP.tsx

## Depois de aplicar
Rodar:

npm run typecheck
npm run lint
npm run build
npm run dev

## Depois reimportar
Reimportar a planilha `Relação de Clientes.xlsx` pelo botão Importar ERP.

## Resultado esperado
A tabela deve mostrar:

- GUARULHOS - SP
- MARINGA - PR
- UBERLANDIA - MG

em vez de:

- 18800 - SP
- 15200 - PR
- 70206 - MG

## Observação
Não é um problema de estrutura SQL. O banco apenas armazenou o valor errado que foi enviado pelo importador. Após corrigir o importador, a reimportação atualiza os registros.

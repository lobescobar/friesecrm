# Etapa 3B — Refatoração segura do ImportarERP

## Objetivo

Organizar o arquivo `components/crm/ImportarERP.tsx` em partes menores, sem mudar a regra de negócio da importação ERP.

## Backup antes de aplicar

Mantenha intacto:

```text
backup-mini-crm-mapa-apos-etapa3a-refatoracao-historico-funcionando
```

## Arquivos do pacote

```text
components/crm/ImportarERP.tsx
components/crm/importar-erp/ImportarERPArquivoInfo.tsx
components/crm/importar-erp/ImportarERPColunasReconhecidas.tsx
components/crm/importar-erp/ImportarERPPrevia.tsx
components/crm/importar-erp/ImportarERPResultado.tsx
components/crm/importar-erp/ImportarERPResumo.tsx
components/crm/importar-erp/ImportarERPSegmentosOficiais.tsx
lib/importacaoERPClientes.ts
types/importacaoERP.ts
utils/importacaoERP.ts
```

## Regras preservadas

- Código do cliente continua usando Código + Loja.
- D = razão social.
- E = nome fantasia.
- AF = CNPJ.
- EK = segmento.
- Cidade continua vindo obrigatoriamente da coluna J.
- Estado continua vindo da coluna H, com fallback por cabeçalho.
- Segmento vazio em EK não apaga segmento existente.
- Status existente do cliente é preservado.
- Upsert continua usando `codigo_cliente`.
- Importação continua em lotes de 50.
- Busca de clientes existentes continua em lotes de 500.
- Auditoria continua registrando `importacao_erp`.

## Teste obrigatório

Depois de copiar os arquivos:

```bash
npm run build
npm run dev
```

Teste:

1. Abra `/crm`.
2. Clique em `Importar ERP`.
3. Selecione a planilha de clientes.
4. Confirme se a prévia mostra os primeiros 20 registros.
5. Confira se D/E/AF/EK continuam corretos.
6. Confirme a importação.
7. Confira se clientes novos e atualizados aparecem corretamente.
8. Confira a auditoria da importação.
9. Confirme que segmentos vazios não apagaram segmentos já cadastrados.

## Publicação

Se passar:

```bash
git status
git add .
git commit -m "Etapa 3B refatora importacao ERP"
git push origin main
```

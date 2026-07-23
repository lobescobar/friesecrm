# Histórico Geral do CRM

Este arquivo centraliza o histórico de correções, ajustes, etapas, decisões técnicas e melhorias aplicadas ao CRM.

---

## Versão atual funcionando

**Projeto:** Mini CRM / Mapa de Clientes  
**Status:** Em organização e limpeza técnica  
**Data da organização:** 2026-07-22  
**Responsável técnico:** LOSBE  

---

## Resumo das principais áreas do sistema

- Login e autenticação
- Cadastro e listagem de clientes
- Mapa de clientes
- Importação de clientes do ERP
- Importação de orçamentos
- Funil de orçamentos
- Gestão de usuários
- Auditoria administrativa
- Cancelamento de orçamentos
- Integração com Supabase
- Integração opcional com Microsoft 365

---

## Histórico consolidado

### Segurança e ambiente

- Arquivos `.env` reais ou backups de `.env` não devem ficar dentro do projeto.
- O projeto deve manter apenas arquivos de exemplo, como `.env.example`.
- Chaves reais devem ficar somente no computador local, na Vercel ou no ambiente seguro de produção.

### Organização de arquivos

- Arquivos antigos de correção, instrução e checklist devem ficar centralizados em `docs/historico/`.
- A raiz do projeto deve conter apenas arquivos essenciais para rodar e manter o sistema.
- Documentações antigas devem ficar em `docs/historico/arquivados/`.

### Performance

- O carregamento de clientes deve evitar `select('*')` quando possível.
- Consultas grandes devem priorizar colunas específicas.
- Filtros, paginação e índices no Supabase devem ser usados para bases grandes.

### Banco de dados

- Alterações em tabelas devem sempre ter backup antes.
- Scripts SQL devem ficar organizados dentro da pasta `supabase/` ou `sql/`.
- Scripts destrutivos devem ser separados e identificados claramente.

### Boas práticas

- Não misturar documentação antiga com arquivos principais do projeto.
- Não manter cache, build ou arquivos temporários no ZIP final.
- Antes de publicar, revisar variáveis de ambiente, build e funcionamento principal.

---

## Arquivos históricos arquivados

Os arquivos antigos devem ser movidos para:

```txt
docs/historico/arquivados/
```

Eles ficam guardados apenas para consulta e não fazem parte da operação principal do CRM.

---

## Próximas melhorias recomendadas

1. Limpar arquivos sensíveis ou temporários.
2. Organizar documentações antigas.
3. Validar build do projeto.
4. Revisar carregamento de clientes.
5. Revisar índices do Supabase.
6. Criar backup da versão limpa funcionando.

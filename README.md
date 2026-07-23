# Mini CRM Mapa

Sistema comercial em Next.js para consulta de clientes, mapa, contatos, alçadas de usuário, importação de planilhas ERP, orçamentos e gestão administrativa.

---

## Resumo do sistema

O Mini CRM Mapa centraliza informações comerciais de clientes e orçamentos, com recursos para:

- Consultar clientes.
- Visualizar clientes no mapa.
- Importar clientes a partir de planilhas ERP.
- Importar orçamentos.
- Consultar histórico de clientes.
- Gerenciar contatos.
- Controlar usuários e permissões.
- Acompanhar funil de orçamentos.
- Registrar auditoria administrativa.
- Trabalhar com dados armazenados no Supabase.

---

## Tecnologias principais

- Next.js
- React
- TypeScript
- Supabase
- Leaflet / React Leaflet
- XLSX
- Microsoft Graph, quando configurado

---

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha com os valores reais somente no ambiente local, servidor ou Vercel.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

MICROSOFT_TENANT_ID=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_MAIL_SENDER=
```

A `SUPABASE_SERVICE_ROLE_KEY` deve ficar somente no servidor. Nunca publique essa chave em repositório público, prints, frontend, ZIP enviado a terceiros ou arquivos compartilhados.

Arquivos que não devem ser enviados ou versionados:

```txt
.env
.env.local
.env.production
.env*.backup
.git
.next
node_modules
tsconfig.tsbuildinfo
```

---

## Instalação

```bash
npm install
```

---

## Desenvolvimento

```bash
npm run dev
```

Abra no navegador:

```txt
http://localhost:3000
```

A rota inicial redireciona para:

```txt
http://localhost:3000/crm
```

---

## Validação antes de publicar

Antes de publicar ou enviar uma versão final, rode:

```bash
npm run lint
npm run typecheck
npm run build
```

Se algum comando apresentar erro, corrija antes de fazer deploy.

---

## Observações importantes sobre o banco

A importação ERP usa `upsert` com conflito por:

```txt
onConflict: "codigo_cliente"
```

Neste projeto, `codigo_cliente` deve representar a chave segura usada para relacionar a planilha ERP com o cadastro do cliente.

Antes de alterar tabelas, índices ou regras no Supabase, faça backup do banco e revise os scripts SQL envolvidos.

---

## Estrutura principal de pastas

```txt
app/           Rotas, páginas e APIs do Next.js
components/    Componentes visuais e módulos do CRM
hooks/         Hooks React reutilizáveis
lib/           Integrações, Supabase, importações e regras auxiliares
types/         Tipagens TypeScript
utils/         Funções utilitárias
public/        Arquivos públicos
sql/           Scripts SQL auxiliares
supabase/      Scripts, migrations, checks e diagnósticos
docs/          Documentação técnica e histórico
```

---

## Arquivos importantes

```txt
app/crm/page.tsx
components/crm/ImportarERP.tsx
components/crm/ImportarOrcamentos.tsx
components/crm/MapaClientes.tsx
components/crm/GestaoUsuarios.tsx
hooks/useClientes.ts
hooks/useFunilOrcamentos.ts
lib/supabase.ts
lib/importacaoERPClientes.ts
lib/importacaoOrcamentos.ts
types/cliente.ts
```

---

## Histórico técnico

O histórico consolidado do projeto está em:

```txt
docs/historico/HISTORICO_GERAL_CRM.md
```

Os arquivos antigos de etapas, correções, instruções e checklists foram arquivados em:

```txt
docs/historico/arquivados/
```

---

## Boas práticas do projeto

- Fazer backup antes de alterações importantes.
- Não publicar arquivos `.env` reais.
- Não enviar `node_modules`, `.next`, `.git` ou caches em ZIPs finais.
- Manter a raiz limpa, com apenas arquivos essenciais.
- Registrar alterações relevantes no histórico técnico.
- Testar `lint`, `typecheck` e `build` antes de publicar.

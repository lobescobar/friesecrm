# Mini CRM Mapa

Sistema comercial em Next.js para consulta de clientes, mapa, contatos, alçadas de usuário e importação de planilhas ERP.

## O que foi estabilizado nesta versão

- A rota `/` redireciona para `/crm`, mantendo uma tela principal única.
- O frontend foi dividido em componentes de CRM e componentes base de UI.
- A importação ERP ganhou fluxo guiado com prévia, colunas reconhecidas, resumo antes da gravação e resultado final sem `alert()`.
- A rota administrativa `/api/admin/create-user` valida o token do usuário e só permite criação por administradores.
- O modal do cliente agora salva observações e status com feedback visual.
- A tabela ganhou versão em cards para celular.
- Foram adicionados estados de carregamento, erro e vazio.
- A gestão de usuários passou a usar seleção de segmentos e estados, evitando texto livre.
- O mapa ganhou legenda, enquadramento automático dos clientes filtrados e integração com o modal.
- O projeto não deve versionar nem enviar `.env.local`, `.env`, `.git`, `.next`, `node_modules` ou `tsconfig.tsbuildinfo`.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha com os valores reais:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

A `SUPABASE_SERVICE_ROLE_KEY` deve ficar somente no servidor. Nunca publique essa chave em repositório público, prints, frontend ou arquivos enviados a terceiros.

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

Abra:

```txt
http://localhost:3000
```

A rota inicial redireciona para:

```txt
http://localhost:3000/crm
```

## Validação

Antes de publicar, rode:

```bash
npm run lint
npm run typecheck
npm run build
```

Nesta versão, `npm run lint` e `npm run typecheck` foram validados no ambiente de revisão. O `npm run build` deve ser rodado em ambiente limpo com dependências instaladas para o sistema operacional local, porque o pacote original continha `node_modules` gerado no Windows.

## Observações importantes sobre o banco

A importação ERP usa `upsert` com:

```txt
onConflict: "codigo_cliente"
```

Neste projeto, `codigo_cliente` deve representar a chave segura **Código + Loja**. Portanto, a coluna `codigo_cliente` precisa ter índice único no Supabase considerando essa chave composta normalizada. Se não houver índice único, a importação pode falhar.

## Arquivos importantes

```txt
app/crm/page.tsx
components/crm/ImportarERP.tsx
components/crm/ClienteModal.tsx
components/crm/TabelaClientes.tsx
components/crm/FiltrosClientes.tsx
components/crm/GestaoUsuarios.tsx
components/crm/MapaClientes.tsx
hooks/useClientes.ts
hooks/useContatos.ts
hooks/useAuth.ts
app/api/admin/create-user/route.ts
lib/supabase.ts
```

## Backup recomendado

Antes de novas alterações grandes, crie uma cópia da pasta com nome semelhante a:

```txt
backup-mini-crm-mapa-versao-corrigida-base-solida
```

Não substitua backups antigos sem confirmar que a versão nova está funcionando.

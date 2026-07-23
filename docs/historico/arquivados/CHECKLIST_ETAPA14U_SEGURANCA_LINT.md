# Checklist — Etapa 14U Segurança + Lint

## O que foi corrigido neste pacote

- Removido o envio de arquivos sensíveis/gerados no ZIP limpo.
- Atualizado `.gitignore` para manter `.env*` fora do versionamento, mas permitir `.env.example`.
- Atualizado `.env.example` sem valores reais e com aviso de segurança.
- Corrigidos os 5 erros de ESLint `react-hooks/set-state-in-effect`.
- Confirmada regra de histórico/orçamentos em 18 meses no código e nos textos da interface.
- Atualizada a chave de cache de orçamentos abertos para evitar reaproveitar cache antigo de 36 meses.

## Validação feita no ambiente de revisão

```bash
npm run lint
npm run typecheck
```

Resultado: ambos passaram sem erro.

## Build

O build não foi concluído no ambiente de revisão porque o ZIP original trouxe `node_modules` gerado em Windows e o Next tentou obter o pacote nativo `@next/swc-linux-x64-gnu`.

Para validar corretamente em máquina local ou Vercel:

```bash
rm -rf node_modules .next
npm install
npm run lint
npm run typecheck
npm run build
npm run dev
```

No Windows PowerShell:

```powershell
Remove-Item -Recurse -Force node_modules, .next
npm install
npm run lint
npm run typecheck
npm run build
npm run dev
```

## Segurança obrigatória

- Rotacionar as chaves do Supabase.
- Atualizar `.env.local` local com as novas chaves.
- Atualizar as variáveis da Vercel.
- Revogar as chaves antigas depois dos testes.
- Nunca enviar `.env.local`, `.git`, `.next`, `node_modules`, `.vercel` ou arquivos de backup com chaves.

## Próxima etapa

Depois de validar o build limpo e rotacionar as chaves, iniciar a Etapa 14V — Tela Administrativa de Auditoria.

# Etapa 14P — Reduzir piscada de carregamento ao retornar ao CRM

## Objetivo

Reduzir a sensação de recarregamento ao alternar janela, minimizar/maximizar ou voltar para o CRM.

A Etapa 14O preservava dados e navegação, mas a tela ainda podia mostrar carregamentos visíveis. Esta etapa ajusta o comportamento para:

- manter os dados na tela quando já existe cache;
- mostrar sincronização em segundo plano em vez de substituir a tela por loading;
- manter perfil/autenticação em cache de sessão para evitar a tela "Iniciando sistema..." em retornos rápidos;
- não alterar Supabase, SQL, tabelas ou permissões.

## Arquivos incluídos

Substituir inteiros:

- `app/crm/page.tsx`
- `hooks/useAuth.ts`
- `utils/sessionCache.ts`

## Testes obrigatórios

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

## Teste visual

1. Abra o CRM.
2. Abra um cliente.
3. Vá para Histórico.
4. Abra um orçamento.
5. Minimize ou alterne para outra janela.
6. Volte ao CRM.
7. A tela deve continuar no mesmo ponto e sem voltar para o carregamento principal.
8. Se houver atualização, deve aparecer apenas uma mensagem discreta de sincronização em segundo plano.

## Commit sugerido

```bash
git status
git add app/crm/page.tsx hooks/useAuth.ts utils/sessionCache.ts INSTRUCOES_ETAPA14P.md
git commit -m "Reduz piscada de carregamento ao retornar ao CRM"
git push origin main
```

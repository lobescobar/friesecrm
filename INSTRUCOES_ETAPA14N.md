# Etapa 14N — Manter a mesma tela ao alternar/minimizar o CRM

## Objetivo

Corrigir o comportamento em que, ao alternar de janela, minimizar o navegador ou voltar para o CRM, a interface pode recarregar visualmente e voltar para uma tela anterior.

## Regra esperada

Se o usuário estiver em:

- cliente aberto;
- aba Dados, Contatos, Histórico, Mapa ou Observações;
- detalhe de um orçamento aberto dentro do Histórico;

ao voltar para o CRM, a tela deve permanecer no mesmo ponto.

## Arquivos alterados

Substituir inteiros:

```txt
app/crm/page.tsx
components/crm/HistoricoCliente.tsx
```

## O que foi ajustado

- O estado atual da navegação passa a ser salvo antes de a janela perder foco.
- O CRM restaura a navegação quando a janela ganha foco novamente.
- O detalhe do orçamento também é restaurado se o modal secundário for desmontado em evento de foco/visibilidade.
- A URL e o `sessionStorage` continuam sendo usados como fontes de restauração.
- Não altera banco de dados.
- Não altera Supabase.
- Não altera importações.
- Não altera status, clientes ou orçamentos.

## Como aplicar

1. Confirme que há backup ou commit funcionando.
2. Copie os arquivos deste pacote por cima da raiz do projeto.
3. Rode:

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

## Teste obrigatório

1. Abra o CRM.
2. Abra um cliente.
3. Vá para Histórico.
4. Abra um orçamento.
5. Minimize o navegador ou alterne para outra janela.
6. Volte para o CRM.
7. O modal do orçamento deve continuar aberto.
8. Feche o orçamento.
9. A tela deve continuar no cliente > Histórico.
10. Feche o cliente.
11. A URL deve voltar para `/crm`.

## Commit sugerido

```bash
git status
git add app/crm/page.tsx components/crm/HistoricoCliente.tsx INSTRUCOES_ETAPA14N.md
git commit -m "Mantem tela atual do CRM ao alternar janelas"
git push origin main
```

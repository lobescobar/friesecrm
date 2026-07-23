# Etapa 3D — Refatoração segura da página principal do CRM

## Objetivo

Organizar `app/crm/page.tsx` sem alterar regra de negócio.

A página principal foi dividida para tirar dela a lógica de navegação interna do CRM e a navegação entre áreas.

## Arquivos incluídos

- `app/crm/page.tsx`
- `components/crm/pagina/NavegacaoAreasCRM.tsx`
- `hooks/useClienteMontado.ts`
- `hooks/useNavegacaoCRM.ts`
- `types/crmNavegacao.ts`
- `utils/crmNavegacao.ts`

## O que foi separado

- Controle de montagem no cliente: `useClienteMontado`
- Estado de navegação do modal do cliente: `useNavegacaoCRM`
- Leitura/gravação de parâmetros na URL: `utils/crmNavegacao.ts`
- Navegação visual entre áreas do CRM: `NavegacaoAreasCRM`

## Regras preservadas

- Abertura de cliente pela URL continua funcionando.
- Aba do modal do cliente continua sendo preservada.
- Orçamento focado no histórico continua sendo preservado.
- Logout continua limpando caches do CRM.
- Áreas de Administração e Auditoria continuam restritas a admin.
- Vendedor continua caindo em Orçamentos se tentar área administrativa.
- Importações continuam chamando os mesmos callbacks.
- Modal do cliente e contatos continuam iguais.

## Ordem segura

1. Faça backup:
   `backup-mini-crm-mapa-antes-etapa3d-refatoracao-page-crm`

2. Copie os arquivos para os caminhos correspondentes.

3. Rode:

```bash
npm run build
npm run dev
```

4. Teste:

- Abrir `/crm`
- Trocar entre Orçamentos, Clientes e Mapa
- Admin: trocar entre Administração e Auditoria
- Abrir um cliente pela lista
- Trocar abas Dados, Contatos, Histórico, Mapa e Observações
- Fechar e abrir cliente novamente
- Abrir cliente a partir de Orçamentos em aberto
- Confirmar que URL com `cliente`, `aba` e `orcamento` continua funcionando
- Fazer logout e login novamente
- Confirmar que cache/navegação antiga não ficou presa

5. Se passar, publique:

```bash
git status
git add .
git commit -m "Etapa 3D refatora pagina principal do CRM"
git push origin main
```

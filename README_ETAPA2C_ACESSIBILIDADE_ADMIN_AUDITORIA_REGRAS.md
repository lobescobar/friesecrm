# Etapa 2C — Acessibilidade em Administração, Auditoria e Regras

## Backup antes de aplicar

Mantenha intacto:

```text
backup-mini-crm-mapa-antes-etapa2c-admin-auditoria-regras
```

## Arquivos incluídos

```text
components/crm/GestaoUsuarios.tsx
components/crm/admin/AuditoriaAdmin.tsx
components/crm/admin/AuditoriaDetalhes.tsx
components/crm/admin/AuditoriaFiltros.tsx
components/crm/admin/AuditoriaResumo.tsx
components/crm/admin/AuditoriaTabela.tsx
components/crm/admin/RegrasCancelamentoOrcamentos.tsx
```

## O que foi ajustado

- Seções administrativas com `aria-labelledby` e títulos acessíveis.
- Mensagens de erro com `role="alert"`.
- Mensagens de carregamento, sucesso e vazio com `role="status"` e `aria-live`.
- Tabelas com `caption` oculto para leitor de tela.
- Cabeçalhos de tabela com `scope="col"`.
- Linhas da auditoria selecionáveis por teclado com Enter ou Espaço.
- Botões de edição com `aria-label` mais descritivo.
- Campos de cadastro/edição com `aria-label`, `autoComplete` e labels preservados.
- Listas de checkbox com `fieldset`, `legend` e descrição acessível.
- Botões de processamento com `loading`/`loadingText` quando aplicável.

## Como testar

```bash
npm run build
npm run dev
```

Teste no CRM:

1. Abra `/crm`.
2. Entre em Administração.
3. Teste Cadastro de usuários: criar, cancelar, editar perfil e alçadas.
4. Teste Regras de cancelamento: cadastrar e-mail, editar, marcar/desmarcar segmentos.
5. Abra Auditoria.
6. Use filtros.
7. Navegue na tabela de auditoria com Tab.
8. Pressione Enter ou Espaço em uma linha para abrir os detalhes.
9. Confirme que a regra de negócio não mudou.

## Observação

Esta etapa não altera banco de dados e não muda regras de permissão. É uma etapa de acessibilidade, leitura por tecnologias assistivas e navegação por teclado.

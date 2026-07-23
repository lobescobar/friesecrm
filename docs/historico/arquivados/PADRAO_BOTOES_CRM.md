# Padrão Oficial de Botões do CRM Friese

**Projeto:** Mini CRM Mapa / Painel Comercial Friese Agroindústria  
**Etapa:** 4A.2 — Padronização oficial de botões  
**Status:** Documento oficial para incrementos futuros  
**Arquivo principal:** `components/ui/Button.tsx`

---

## 1. Objetivo

Fixar o padrão visual e funcional de botões do CRM para evitar estilos soltos, inconsistência visual e duplicação de classes Tailwind em componentes diferentes.

Todo botão comum do CRM deve usar o componente centralizado:

```tsx
import { Button } from "@/components/ui/Button";
```

ou, conforme o padrão de importação já usado no projeto:

```tsx
import Button from "@/components/ui/Button";
```

---

## 2. Regra obrigatória

Não criar botões comuns com classe manual solta:

```tsx
<button className="...">
  Salvar
</button>
```

Usar sempre:

```tsx
<Button variant="primary">
  Salvar
</Button>
```

Exceções só devem acontecer em casos muito específicos, justificados no próprio componente, por exemplo: botão nativo invisível de acessibilidade, controle externo de biblioteca ou componente de mapa que exija estrutura própria.

---

## 3. Variants oficiais

| Variant | Quando usar | Exemplos | Visual |
|---|---|---|---|
| `primary` | Ação principal | Salvar, Confirmar, Cadastrar, Criar usuário, Salvar registro | Azul-marinho/escuro, texto branco |
| `secondary` | Ação neutra ou alternativa | Fechar, Cancelar, Voltar, Limpar filtros, Selecionar arquivo | Fundo branco/cinza, borda suave, texto escuro |
| `success` | Ação positiva/importação | Importar ERP, Importar Orçamentos, Concluir, Ativar | Verde, texto branco |
| `danger` | Ação destrutiva/crítica | Excluir, Remover, Solicitar cancelamento, Desativar | Vermelho, texto branco |
| `ghost` | Ação discreta | Editar, Abrir, Histórico, Ver detalhes | Transparente ou fundo mínimo |

---

## 4. Tamanhos oficiais

| Size | Uso | Diretriz |
|---|---|---|
| `sm` | Ações compactas em tabela, linha ou chips | Altura aproximada 32–36px |
| `md` | Padrão geral do CRM | Altura mínima 40px |
| `lg` | Ação principal destacada em tela/modal | Altura mínima 44px |

---

## 5. Loading obrigatório para ações assíncronas

Botões que salvam, importam, removem, ativam ou chamam API devem usar `loading` e `loadingText` quando houver estado de processamento.

```tsx
<Button
  variant="success"
  loading={importando}
  loadingText="Importando..."
>
  Importar ERP
</Button>
```

O componente bloqueia novo clique automaticamente quando `loading={true}`.

---

## 6. Exemplos oficiais

### Salvar / confirmar

```tsx
<Button variant="primary" type="submit">
  Salvar alterações
</Button>
```

### Fechar / cancelar / voltar

```tsx
<Button variant="secondary" onClick={onClose}>
  Fechar
</Button>
```

### Importar ERP ou Orçamentos

```tsx
<Button
  variant="success"
  loading={importando}
  loadingText="Importando..."
  onClick={handleImportar}
>
  Importar Orçamentos
</Button>
```

### Excluir / remover / desativar

```tsx
<Button
  variant="danger"
  size="sm"
  onClick={handleExcluir}
>
  Excluir
</Button>
```

### Ação discreta em tabela

```tsx
<Button
  variant="ghost"
  size="sm"
  aria-label={`Abrir histórico do cliente ${cliente.nome}`}
  onClick={() => abrirHistorico(cliente)}
>
  Histórico
</Button>
```

---

## 7. Acessibilidade

1. Todo botão precisa ter texto visível ou `aria-label`.
2. Botões apenas com ícone devem obrigatoriamente informar `aria-label`.
3. Foco visível deve ser preservado.
4. Ações destrutivas devem usar `variant="danger"` e confirmação quando necessário.
5. Botões com carregamento devem usar `loading` e `loadingText`.
6. Botão dentro de formulário que envia dados deve informar `type="submit"`.
7. Botão comum fora de formulário usa o padrão seguro `type="button"`.

---

## 8. Mapa de conversão seguro

Use esta tabela ao substituir botões antigos:

| Texto/Ação antiga | Novo padrão |
|---|---|
| Salvar, Confirmar, Cadastrar, Criar usuário | `<Button variant="primary">` |
| Fechar, Cancelar, Voltar, Limpar filtros | `<Button variant="secondary">` |
| Selecionar arquivo | `<Button variant="secondary">` |
| Importar ERP, Importar Orçamentos, Concluir, Ativar | `<Button variant="success">` |
| Excluir, Remover, Desativar, Solicitar cancelamento | `<Button variant="danger">` |
| Editar, Abrir, Histórico, Ver detalhes | `<Button variant="ghost" size="sm">` |

---

## 9. Arquivos onde aplicar com segurança

A aplicação deve ser gradual. Não alterar regra de negócio junto com alteração visual.

Começar por botões simples em:

1. `components/ImportarERP.tsx`
2. `components/ImportarOrcamentos.tsx`
3. `components/HistoricoCliente.tsx`
4. `app/crm/page.tsx`
5. Telas administrativas apenas após conferir permissões e ações destrutivas

Antes de substituir em formulários, verificar se o botão antigo dependia do comportamento padrão de submit. Se dependia, usar:

```tsx
<Button type="submit" variant="primary">
  Salvar
</Button>
```

---

## 10. Checklist antes de concluir a etapa 4A.2

- [ ] `components/ui/Button.tsx` existe e está revisado.
- [ ] Todos os variants oficiais foram implementados.
- [ ] `size="sm"`, `size="md"` e `size="lg"` foram implementados.
- [ ] `loading` e `loadingText` funcionam.
- [ ] Botões com ícone têm `aria-label`.
- [ ] Nenhuma regra de negócio foi alterada.
- [ ] Nenhuma ação destrutiva foi suavizada visualmente.
- [ ] `npm run build` passa sem erro.
- [ ] Backup da versão anterior foi preservado.

---

## 11. Comandos de validação

```bash
npm run build
```

Se o projeto tiver lint configurado:

```bash
npm run lint
```

Teste visual recomendado:

```bash
npm run dev
```

Abrir o CRM e conferir:

1. Importação de ERP.
2. Importação de Orçamentos.
3. Histórico do cliente.
4. Botões de filtro, fechar, cancelar e limpar.
5. Botões de ação em tabela.
6. Botões destrutivos, sem executar exclusões reais em produção.

---

## 12. Registro da etapa

**Versão recomendada após validação:**  
`backup-mini-crm-mapa-apos-etapa4A2-padrao-botoes-funcionando`

**Descrição:**  
Etapa 4A.2 concluída com Button.tsx padronizado, variants oficiais, tamanhos oficiais, loading acessível e documentação de uso para incrementos futuros.

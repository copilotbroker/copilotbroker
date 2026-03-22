

# Fix: Virtualização não está funcionando — cards todos renderizados

## Causa raiz

A cadeia de alturas CSS está quebrada. O virtualizer precisa que o scroll container tenha uma **altura fixa/constrained** para saber quais items estão visíveis. Atualmente:

```text
Board:   flex-1 min-h-0 overflow-x-auto overflow-y-hidden  ← tem altura fixa ✓
  └─ div: flex gap-3 min-w-max                             ← SEM h-full ✗
      └─ Column: flex flex-col min-h-[600px]               ← SEM max-height ✗
          └─ Scroll: flex-1 min-h-0 overflow-y-auto        ← EXPANDE infinitamente ✗
```

Sem constraint de altura, o scroll container **expande para caber todo o conteúdo**. O virtualizer acha que tudo está visível → renderiza todos os items → sentinel sempre visível → fetchNextPage em cascata → carrega todas as páginas.

## Correção

### `src/components/crm/KanbanBoard.tsx` (1 linha)
- Adicionar `h-full` no div wrapper das colunas (linha 710):
  `"flex gap-3 md:gap-4 min-w-max"` → `"flex gap-3 md:gap-4 min-w-max h-full"`

### `src/components/crm/KanbanColumn.tsx` (1 linha)
- Trocar `min-h-[600px]` por `h-full` no container da coluna (linha 140):
  `"flex flex-col w-[280px] md:min-w-[300px] md:max-w-[320px] shrink-0 min-h-[600px]"` → `"flex flex-col w-[280px] md:min-w-[300px] md:max-w-[320px] shrink-0 h-full min-h-[400px]"`

Isso propaga a altura fixa do board até o scroll container, fazendo o virtualizer funcionar corretamente: apenas ~5 cards no DOM por coluna (3 visíveis + 2 overscan) em vez de todos.

## Impacto
- DOM nodes por coluna: de ~todos os leads → ~5 cards
- Fetch de páginas: apenas 1 página inicial (15 leads) até o usuário scrollar
- Sentinel só dispara quando o usuário realmente chega perto do fim da lista


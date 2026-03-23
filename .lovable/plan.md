

# Fix: Kanban do corretor não propaga altura corretamente

## Problema

No Admin, o `KanbanBoard` é filho direto do `<main>` e recebe `flex-1 min-h-0` corretamente. No Broker, há um wrapper intermediário que quebra a cadeia:

```text
Admin (funciona):
  main flex-1 min-h-0
    └─ KanbanBoard flex-1 min-h-0    ← recebe altura ✓

Broker (quebrado):
  main flex-1 min-h-0
    └─ div.flex-1.min-h-[400px].space-y-4    ← NÃO propaga flex ✗
        └─ BrokerRoletas                      ← consome espaço variável
        └─ KanbanBoard flex-1 min-h-0         ← não recebe altura ✗
```

O wrapper em `BrokerAdmin.tsx` (linha 184) usa `min-h-[400px] space-y-4` mas **não é flex column** e não tem `min-h-0`. Isso impede que o KanbanBoard receba altura constrained → virtualização falha → todos os cards são renderizados → scroll não funciona como esperado.

## Correção

### `src/pages/BrokerAdmin.tsx` (linha 184)

Trocar o wrapper do kanban de:
```tsx
<div className="flex-1 min-h-[400px] space-y-4">
```

Para:
```tsx
<div className="flex-1 min-h-0 flex flex-col gap-4">
```

Isso faz o wrapper virar um flex column container que:
1. Encolhe com `min-h-0` (não força altura mínima)
2. O `BrokerRoletas` ocupa seu espaço natural (colapsável)
3. O `KanbanBoard` com `flex-1 min-h-0` preenche o resto — virtualização funciona

### Cadeia corrigida:
```text
BrokerLayout: h-screen overflow-hidden
  └─ main: flex-1 min-h-0 flex flex-col
      └─ div: flex-1 min-h-0 flex flex-col gap-4    ← CORRIGIDO
          └─ BrokerRoletas (altura natural, ~60px)
          └─ KanbanBoard: flex-1 min-h-0             ← RECEBE ALTURA ✓
              └─ Virtualizer funciona ✓
```

Mudança de 1 linha, mesmo padrão do Admin.


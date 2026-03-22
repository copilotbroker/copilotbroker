

# Fix: Cadeia de alturas CSS quebrada impede virtualização

## Causa raiz

A virtualização requer que **toda a cadeia de containers** tenha altura constrained. Atualmente a cadeia está quebrada em 3 pontos:

```text
AdminLayout outer:  min-h-screen flex flex-col         ← CRESCE infinitamente ✗
  └─ main:          flex-1 flex flex-col p-3            ← SEM min-h-0, não encolhe ✗
      └─ Board root: flex flex-col min-h-[700px]        ← CRESCE com conteúdo ✗
          └─ Board:  flex-1 min-h-0 overflow-x/y        ← deveria constrainar ✓
              └─ div: flex h-full                       ← ok ✓
                  └─ Column: h-full min-h-[400px]       ← ok ✓
                      └─ Scroll: flex-1 overflow-y-auto ← EXPANDE porque pais expandem ✗
```

Sem constraint no topo, `flex-1` + `min-h-0` no board não funciona porque o pai (`main`) cresce livremente. O scroll container expande para caber todo o conteúdo → virtualizer renderiza tudo → sentinel visível imediatamente → fetchNextPage em cascata.

## Correção (3 arquivos, 3 linhas)

### 1. `src/components/admin/AdminLayout.tsx` (linha 55)
O wrapper de conteúdo precisa de altura fixa e `min-h-0`:
```
// DE:
<div className="md:ml-16 min-h-screen flex flex-col pb-20 md:pb-0">

// PARA:
<div className="md:ml-16 h-screen flex flex-col pb-20 md:pb-0 overflow-hidden">
```

A `main` também precisa de `min-h-0` (linha 62):
```
// DE:
<main className="flex-1 flex flex-col p-3 md:p-6">

// PARA:
<main className="flex-1 flex flex-col min-h-0 p-3 md:p-6">
```

### 2. `src/components/crm/KanbanBoard.tsx` (linha 560)
O root do board precisa ser `flex-1 min-h-0` em vez de `min-h-[700px]`:
```
// DE:
<div className="flex flex-col min-h-[700px]">

// PARA:
<div className="flex flex-col flex-1 min-h-0">
```

### 3. Proteção extra no `KanbanColumn.tsx`
Reduzir `rootMargin` do IntersectionObserver de `300px` para `200px` para evitar trigger prematuro em edge cases.

## Como funciona

```text
AdminLayout:  h-screen overflow-hidden flex flex-col   ← ALTURA FIXA ✓
  └─ main:    flex-1 min-h-0 flex flex-col              ← ENCOLHE ✓
      └─ Board: flex-1 min-h-0 flex flex-col             ← ENCOLHE ✓
          └─ Scroll area: flex-1 min-h-0 overflow-y-auto ← SCROLL REAL ✓
              └─ Virtualizer: só renderiza ~5 cards       ← FUNCIONA ✓
```

## Impacto
- Cards no DOM: de centenas → ~5 por coluna
- Requests iniciais: de ~18 (3 páginas × 6 colunas) → 6 (1 página × 6 colunas)
- Sentinel só dispara no scroll real do usuário
- Outras tabs admin (leads, brokers, etc.) não afetadas: elas scrollam normalmente dentro do `overflow-hidden` do layout, pois cada uma tem seu próprio scroll container


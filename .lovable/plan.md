

# Fix: Broker Kanban not virtualizing (renders all cards)

## Root Cause

The Admin and Broker layouts handle the `<main>` element differently, which breaks virtualization for the broker:

```text
AdminLayout  <main>:  "flex-1 flex flex-col min-h-0 p-3 md:p-6"
BrokerLayout <main>:  "flex-1 min-h-0 overflow-y-auto p-3 pb-20 lg:p-6 lg:pb-6"
```

The `overflow-y-auto` on BrokerLayout's `<main>` creates a scrollable container that absorbs all content height. The KanbanBoard and its columns expand to full height inside this scrollable area, so the virtualizer's scroll container never gets a constrained height -- and all cards render at once.

AdminLayout does NOT have `overflow-y-auto` on `<main>`. Instead, it uses `flex flex-col` to pass the height constraint down the chain to the KanbanBoard, which manages its own internal scrolling per column.

## Fix

### 1. BrokerLayout `<main>` — conditional overflow based on viewMode

**File: `src/components/broker/BrokerLayout.tsx`**

- Add `viewMode` to the props being used (already received).
- Change `<main>` classes:
  - Kanban mode: `flex-1 flex flex-col min-h-0 p-3 lg:p-6` (matches AdminLayout — no overflow-y-auto)
  - List mode: `flex-1 min-h-0 overflow-y-auto p-3 pb-20 lg:p-6 lg:pb-6` (current behavior, scrollable)

This ensures the CSS height chain (`h-screen → flex-col → flex-1 min-h-0 → flex-col → flex-1 min-h-0`) reaches the virtualizer in kanban mode.

### 2. Move `pb-20` to the parent div for kanban mode

In kanban mode, the bottom nav padding needs to be on the outer flex container (like AdminLayout's `pb-20 md:pb-0`), since `<main>` won't be scrollable.

Change the parent `<div>` from:
```
className="lg:ml-16 h-screen flex flex-col overflow-hidden"
```
to conditionally add `pb-20 lg:pb-0` when in kanban mode, ensuring the bottom nav doesn't overlap columns.

### Summary of CSS chain after fix (kanban mode)
```text
div    "lg:ml-16 h-screen flex flex-col pb-20 lg:pb-0 overflow-hidden"
  main "flex-1 flex flex-col min-h-0 p-3 lg:p-6"
    KanbanBoard "flex flex-col flex-1 min-h-0"
      columns-row "flex-1 min-h-0 overflow-x-auto overflow-y-hidden"
        KanbanColumn scroll container → virtualizer works ✓
```


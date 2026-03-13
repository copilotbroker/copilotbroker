

## Problem

The horizontal scroll on the "Landing Pages" page at mobile (390px) is caused by:

1. **Long URL text** in the "Publicados" card — `https://8855e0c5-1ec6-49e7-83f4-12e453004e21.lovableproject.com/...` overflows despite `truncate` because the parent flex container doesn't constrain it enough.
2. **Badge wrapping** — multiple badges in a row can push content beyond viewport.
3. **Missing `overflow-x-hidden`** on the page-level container.

## Plan

### 1. Add `overflow-x-hidden` to the main page wrapper
In `BrokerProjects.tsx`, the content is rendered inside `<BrokerLayout>` which uses `<main className="flex-1 flex flex-col p-3 lg:p-6">`. Add `overflow-hidden` to the outermost wrapper element inside the return (the header div and Tabs container area) OR add `overflow-x-hidden` on the `BrokerLayout` main div.

**File: `src/components/broker/BrokerLayout.tsx`**
- Add `overflow-x-hidden` to the main content `<div className="lg:ml-16 ...">` to prevent any child from causing horizontal scroll.

### 2. Fix URL text overflow in project cards  
**File: `src/pages/BrokerProjects.tsx`**
- In `renderProjectCard` (line 256): The URL `<p>` has `truncate` but the parent `div` at line 241 needs `overflow-hidden` and `w-full` constraints. Ensure the flex container properly constrains text.
- Add `overflow-hidden` and `w-0 flex-1` pattern to the text container to force truncation to work in flex layouts.

### 3. Fix badge overflow in draft cards
- In `renderDraftCard` (line 191): badges use `flex-wrap` which is good, but ensure the parent container also has `overflow-hidden`.

### 4. Fix header area  
- Line 310: The header `flex` container already has `overflow-hidden`, which is fine.
- The Tabs area (line 339-340): The `TabsList` with two tabs may overflow on small screens. Add `w-full` and ensure tabs can shrink with `flex-1 min-w-0 truncate` on each trigger.


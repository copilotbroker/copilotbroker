

# Fix: Scroll bloqueado em monitores menores / zoom

## Problema raiz

Os layouts `AdminLayout.tsx` e `BrokerLayout.tsx` usam `h-screen overflow-hidden` no container principal. O `<main>` dentro deles nem sempre tem `overflow-y-auto`, impedindo rolagem em telas menores ou com zoom.

- **AdminLayout** (linha 55): `h-screen flex flex-col overflow-hidden` — o `<main>` (linha 62) usa `flex-1 flex flex-col min-h-0` mas **sem overflow-y-auto**
- **BrokerLayout** (linha 96): no modo `kanban`, o `<main>` também não tem overflow-y-auto (correto para Kanban virtualizado, mas problemático para todas as outras páginas que usam `viewMode="kanban"`)

Páginas afetadas: Admin CRM, Admin Copiloto, Admin Corretores, Admin Projetos, Admin Roletas, Admin Inteligência, Broker Copiloto, Broker Roletas, Broker Landing Pages, e qualquer outra página dentro desses layouts.

## Solução

### 1. `src/components/admin/AdminLayout.tsx`
- Adicionar `overflow-y-auto` ao `<main>` para que todo conteúdo dentro do AdminLayout seja rolável
- Manter `min-h-0` (necessário para flex shrink) e adicionar `overflow-y-auto`
- De: `"flex-1 flex flex-col min-h-0 p-3 md:p-6"`
- Para: `"flex-1 flex flex-col min-h-0 overflow-y-auto p-3 md:p-6"`

### 2. `src/components/broker/BrokerLayout.tsx`
- No modo `kanban`, adicionar `overflow-y-auto` ao `<main>` — isso permite que páginas que usam Kanban mode (como Roletas e Copiloto do corretor) possam rolar. O KanbanBoard internamente gerencia seu próprio scroll, então não será afetado negativamente.
- De (kanban): `"flex-1 flex flex-col min-h-0 p-3 lg:p-6"`
- Para (kanban): `"flex-1 flex flex-col min-h-0 overflow-y-auto p-3 lg:p-6"`

### 3. `src/pages/AdminAgenda.tsx` e `src/pages/BrokerAgenda.tsx`
- Já têm `overflow-auto` no `<main>` — sem alteração necessária.

### Impacto
- O KanbanBoard não será afetado: ele usa `flex-1 min-h-0` com colunas que fazem seu próprio scroll horizontal/vertical internamente
- Todas as outras páginas (Corretores, Projetos, Roletas, Copiloto, Inteligência) passam a ter scroll vertical funcional
- Monitores pequenos, zoom alto, e resoluções baixas passam a funcionar corretamente

**2 arquivos alterados**: `AdminLayout.tsx`, `BrokerLayout.tsx`


# Filtro por período no Kanban

Reutilizar o `PeriodFilterWithCustom` (mesmo componente usado em `/dashboard`) na toolbar do Kanban, filtrando os leads por **data de criação** (`created_at`) dentro do período selecionado. Padrão inicial: **Todo período**. Opções: Hoje, 7 dias, 30 dias, Todo período e Personalizado.

## Alterações

### 1. `src/components/crm/KanbanBoard.tsx`
- Importar `PeriodFilterWithCustom` e `getPeriodDates`.
- Novo estado: `period` (default `"all"`) e `customRange` (default `null`).
- Calcular `periodDates` via `useMemo` (mesma lógica do Dashboard).
- Adicionar `periodStart` e `periodEnd` ao objeto `columnFilters`.
- Renderizar `<PeriodFilterWithCustom showAllPeriod />` dentro de `filterButtonsJsx`, no início da linha de filtros (antes do seletor de Empreendimento), aparecendo no desktop e no portal mobile.

### 2. `src/hooks/use-kanban-column.ts`
- Estender `KanbanColumnFilters` com `periodStart?: Date | null` e `periodEnd?: Date | null`.
- Em `applyFilters`, quando ambos estiverem definidos, aplicar:
  `query.gte("created_at", periodStart.toISOString()).lte("created_at", periodEnd.toISOString())`.
- Incluir os timestamps na `filtersKey` (via `getTime()`) para invalidar cache quando o período mudar.

## Comportamento
- Filtro afeta todas as colunas do Kanban (contagens e listas), igual aos demais filtros.
- Padrão "Todo período" usa `start = 2020-01-01` (definido em `getPeriodDates`) — equivalente a não filtrar.
- Não altera roleta, automações ou regras de negócio — apenas a visualização.

## Fora de escopo
- Não muda o filtro de período do Dashboard.
- Não persiste a seleção em URL/localStorage.

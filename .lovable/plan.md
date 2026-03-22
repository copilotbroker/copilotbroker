

# Otimização de Performance do Kanban

## Diagnóstico

Identifiquei os seguintes gargalos:

1. **PAGE_SIZE = 30 por coluna**: Com 6 colunas, são 180 leads carregados inicialmente. Na tela (~600px de altura, ~210px por card) cabem apenas ~3 cards visíveis por coluna = 18 cards no total.

2. **overscan: 5**: Cada coluna renderiza 5 cards extras acima e abaixo da área visível. São 60 cards extras no DOM sem necessidade.

3. **Polling agressivo com realtime redundante**: Todas as 12 queries (6 data + 6 count) fazem polling a cada 15s com `staleTime: 10s`, mas já existe uma subscription realtime que invalida queries automaticamente. Isso gera ~50 requests/minuto desnecessários.

4. **Labels query key instável**: O `leadIdsKey` (concatenação de 30 UUIDs) muda toda vez que os leads mudam, causando re-fetch cascata.

5. **`useActiveFlowLeads` duplicado**: Chamado 6x (uma por coluna via `useKanbanColumn`), apesar do React Query deduplicar. O Board já chama esse hook separadamente na linha 240.

## Mudanças

### 1. `src/hooks/use-kanban-column.ts`
- Reduzir `PAGE_SIZE` de 30 para **15** (suficiente para preencher a tela + scroll inicial)
- Aumentar `staleTime` para 30s e `refetchInterval` para 60s (realtime já cuida de atualizações instantâneas)
- Receber `activeFlowLeadIds` como parâmetro em vez de cada coluna chamar o hook separadamente

### 2. `src/components/crm/KanbanColumn.tsx`
- Reduzir `overscan` de 5 para **2** (suficiente para scroll suave, reduz ~36 cards no DOM)
- Estabilizar o query key das labels usando um hash simples em vez de concatenar 15+ UUIDs
- Aumentar `staleTime` das labels para 60s

### 3. `src/components/crm/KanbanBoard.tsx`
- Passar `activeFlowLeadIds`/`activeFlowIdList`/`activeFlowSignature` como props para o `KanbanColumn`, evitando 6 hooks duplicados
- Aumentar `staleTime` do realtime-related polling

### Detalhes técnicos

```text
// use-kanban-column.ts
- PAGE_SIZE: 30 → 15
- staleTime: 10_000 → 30_000
- refetchInterval: 15_000 → 60_000
- Novo parâmetro: activeFlowData passado externamente

// KanbanColumn.tsx
- overscan: 5 → 2
- Labels staleTime: 30_000 → 60_000
- Hash do leadIdsKey em vez de join(",")

// KanbanBoard.tsx
- Passa activeFlow data para KanbanColumn como props
- KanbanColumn repassa para useKanbanColumn
```

Impacto estimado:
- DOM nodes: ~180 cards → ~60 cards (-67%)
- Network requests/min: ~50 → ~12 (-76%)
- Hooks duplicados eliminados: 5 instâncias de useActiveFlowLeads


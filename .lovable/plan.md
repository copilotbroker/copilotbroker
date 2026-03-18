

## Diagnóstico de Lentidão do Kanban

### Causa raiz

Cada `KanbanCard` renderiza um `LeadLabelsPicker` que chama `useLeadWhatsAppLabels` com `enabled: true`. Isso dispara **2 queries por card** (catálogo de labels + labels do lead) **imediatamente na renderização**, mesmo sem o usuário interagir.

Com ~30 cards por coluna × 6 colunas = **até 360 queries simultâneas** ao Supabase no carregamento do Kanban. Isso satura a rede e trava a UI.

### Solução

Tornar as queries **lazy** — só buscar dados quando o popover for aberto.

### Mudanças

| Arquivo | O que muda |
|---------|-----------|
| `src/components/crm/LeadLabelsPicker.tsx` | Passar `enabled: open` ao hook (queries só disparam ao abrir o popover). Aceitar prop opcional `preloadedLabels` para exibir o nome/cor da etiqueta no botão sem query. |
| `src/hooks/use-lead-whatsapp-labels.ts` | Nenhuma mudança no hook em si — já aceita `enabled`. |
| `src/components/crm/KanbanCard.tsx` | Buscar labels do lead via uma query única e leve no nível da **coluna** (batch), e passar os dados já carregados como prop ao `LeadLabelsPicker`. |
| `src/components/crm/KanbanColumn.tsx` | Adicionar uma query batch que busca `lead_whatsapp_labels` + `whatsapp_labels` para todos os lead_ids da coluna de uma vez, e repassa um mapa `leadId → labels[]` aos cards. |

### Detalhes técnicos

**1. Query batch na coluna (KanbanColumn)**
```typescript
// Uma única query para todos os leads da coluna
const leadIds = leads.map(l => l.id);
const { data: allLeadLabels } = useQuery({
  queryKey: ["column-lead-labels", status, leadIds.join(",")],
  enabled: leadIds.length > 0,
  queryFn: async () => {
    const { data } = await supabase
      .from("lead_whatsapp_labels")
      .select("lead_id, label:whatsapp_labels(id, name, color)")
      .in("lead_id", leadIds);
    return data || [];
  },
  staleTime: 30_000,
});

// Agrupar por lead_id em um Map
const labelsByLead = useMemo(() => {
  const map = new Map();
  for (const row of allLeadLabels || []) {
    if (!map.has(row.lead_id)) map.set(row.lead_id, []);
    if (row.label) map.get(row.lead_id).push(row.label);
  }
  return map;
}, [allLeadLabels]);
```

**2. LeadLabelsPicker lazy**
- `enabled` passa de `true` para `open` (estado do Popover)
- Recebe `preloadedLabels` para renderizar o botão com nome/cor sem query
- Quando o popover abre, aí sim carrega o catálogo completo para toggle

**Resultado**: De ~360 queries → 6 queries (uma por coluna) + queries sob demanda ao abrir o popover. Redução de ~98% nas chamadas ao banco.




## Plano: Filtro de Etiquetas condicionado ao Corretor selecionado

### Problema
No admin, o filtro de etiquetas aparece sempre (se houver labels), mas etiquetas são pessoais de cada corretor. Faz sentido só mostrar o filtro após selecionar um corretor específico.

### Mudanças

| Arquivo | O que muda |
|---------|-----------|
| `src/pages/Admin.tsx` | Adicionar query para buscar `whatsapp_labels` filtrado pelo `brokerFilter` selecionado. Passar resultado como prop `labels` ao `LeadsAdvancedFilters`. Limpar `labelFilter` quando o corretor mudar. |
| `src/components/admin/LeadsAdvancedFilters.tsx` | O componente já suporta a prop `labels` e já esconde o filtro quando `labels.length === 0`. Nenhuma mudança necessária neste arquivo. |

### Detalhes técnicos

**Admin.tsx** - adicionar:
```typescript
// Query de labels condicionada ao corretor selecionado
const selectedBrokerId = filters.brokerFilter !== "all" && filters.brokerFilter !== "enove" 
  ? filters.brokerFilter : null;

const { data: brokerLabels = [] } = useQuery({
  queryKey: ["admin-broker-labels", selectedBrokerId],
  enabled: !!selectedBrokerId,
  queryFn: async () => {
    const { data } = await supabase
      .from("whatsapp_labels")
      .select("id, name, color")
      .eq("broker_id", selectedBrokerId)
      .order("name");
    return data || [];
  },
});

// Limpar labelFilter quando trocar de corretor
const handleFiltersChange = (newFilters: LeadFilters) => {
  if (newFilters.brokerFilter !== filters.brokerFilter) {
    newFilters.labelFilter = [];
  }
  setFilters(newFilters);
};
```

Passar `labels={brokerLabels}` e `onFiltersChange={handleFiltersChange}` ao componente.

### Resultado
- Sem corretor selecionado → filtro de etiqueta não aparece
- Corretor selecionado → busca etiquetas daquele corretor e exibe o filtro
- Trocar de corretor → limpa filtro de etiqueta automaticamente


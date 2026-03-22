

# Corrigir filtro de Etiquetas no Kanban Admin

## Problema
O filtro de Etiquetas busca **todas** as etiquetas de todos os corretores quando o admin está logado (linha 72-84). Etiquetas são vinculadas a instâncias individuais de WhatsApp, então sem selecionar um corretor específico, o filtro não faz sentido.

## Mudanças

### `src/components/crm/KanbanBoard.tsx`

1. **Query de labels**: Condicionar a query `whatsapp-labels-for-filter` ao `selectedBroker` (não ao `brokerId` do admin). Quando `isAdmin`, só buscar labels quando `selectedBroker` não for `"all"` nem `"enove"`, filtrando por `selectedBroker` como `broker_id`.

2. **Limpar etiquetas ao trocar corretor**: Adicionar `useEffect` que limpa `selectedLabelIds` quando `selectedBroker` muda.

3. **UI**: Mover o filtro de Etiquetas para **depois** do seletor de Corretor, e só exibi-lo quando um corretor específico estiver selecionado (não `"all"` nem `"enove"`).

### Detalhes técnicos

```text
// Query condicionada:
const effectiveLabelBrokerId = isAdmin
  ? (selectedBroker !== "all" && selectedBroker !== "enove" ? selectedBroker : null)
  : brokerId;

useQuery({
  queryKey: ["whatsapp-labels-for-filter", effectiveLabelBrokerId],
  enabled: !!effectiveLabelBrokerId,
  queryFn: ... .eq("broker_id", effectiveLabelBrokerId)
});

// Limpar ao trocar corretor:
useEffect(() => { setSelectedLabelIds([]); }, [selectedBroker]);

// UI: mover bloco de Etiquetas para depois do Select de Corretor
// Só exibir se effectiveLabelBrokerId existir e availableLabels.length > 0
```


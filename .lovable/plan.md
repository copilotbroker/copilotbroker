

# Excluir cadências/campanhas + separar campanhas ativas das finalizadas

## Resumo

Permitir exclusão de cadências e campanhas. Na listagem de campanhas, exibir apenas as ativas (draft, scheduled, running, paused). Campanhas concluídas/canceladas ficam acessíveis via botão "Histórico".

## Arquivos alterados

### 1. `src/hooks/use-whatsapp-campaigns.ts`
- Adicionar mutation `deleteCampaign(id)`: deleta `campaign_steps` e `whatsapp_message_queue` associados, depois deleta a campanha. Invalida query cache.

### 2. `src/components/whatsapp/CampaignCard.tsx`
- Adicionar prop `onDelete: (id: string) => void`
- Adicionar botão de delete (Trash2) no grupo de ações, visível para campanhas concluídas/canceladas ou qualquer status

### 3. `src/components/whatsapp/AutoCadenciaSection.tsx`
- Importar `deleteCampaign` do hook
- Separar campanhas em duas listas:
  - `activeCampaigns`: status `draft`, `scheduled`, `running`, `paused`
  - `archivedCampaigns`: status `completed`, `cancelled`
- Exibir `activeCampaigns` normalmente na seção "Campanhas"
- Adicionar botão "Histórico de campanhas" (com ícone Archive) que abre um colapsável ou dialog com as campanhas arquivadas
- Passar `onDelete` para `CampaignCard` com confirmação via `window.confirm`

### 4. Cadências (já funciona)
- A exclusão de cadências já está implementada via `deleteRule` e botão Trash2 na listagem

## Detalhes técnicos

**Delete campaign** (no hook):
```typescript
const deleteCampaignMutation = useMutation({
  mutationFn: async (campaignId: string) => {
    await supabase.from("whatsapp_message_queue").delete().eq("campaign_id", campaignId);
    await supabase.from("campaign_steps").delete().eq("campaign_id", campaignId);
    await supabase.from("whatsapp_campaigns").delete().eq("id", campaignId);
  },
  onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["whatsapp-campaigns"] }); toast.success("Campanha excluída"); }
});
```

**Separação na UI**:
- Filtro simples: `campaigns.filter(c => !["completed","cancelled"].includes(c.status))` para ativas
- Botão colapsável com `useState(showArchived)` para mostrar/esconder finalizadas
- Contagem no botão: "Histórico (3)"


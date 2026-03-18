

## Plano: Unificação de Leads Duplicados

### Problema

Quando o mesmo telefone se cadastra múltiplas vezes na landing page de um corretor, são criados leads separados no Kanban. Isso acontece porque **nenhuma das landing pages** (exceto CaminhadaEV) chama a função `unify_lead` após inserir o lead. Resultado: 4 cards para "Maicon" no Kanban do Davi.

### Causa Raiz

- `FormSection.tsx`, `GVFormSection.tsx`, `MCFormSection.tsx` — **não chamam** `unify_lead`
- `auto-cadencia-10d` e `auto-first-message` — recebem o `leadId` novo mas **não unificam** antes de criar a cadência
- Apenas `CaminhadaEV.tsx` e os modais admin chamam `unify_lead`

### Solução

Centralizar a chamada de `unify_lead` **nas edge functions** (`auto-cadencia-10d` e `auto-first-message`), que já usam `service_role` e são chamadas por **todas** as landing pages. Assim, qualquer entrada duplicada é unificada automaticamente antes de criar cadência/mensagem.

Adicionalmente, adicionar `unify_lead` nas 3 landing pages que não o chamam, para cobrir o caso onde nenhuma automação está ativa.

### Arquivos a editar

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/auto-cadencia-10d/index.ts` | Chamar `unify_lead` logo após validar o lead, usar o ID retornado para o resto do fluxo |
| `supabase/functions/auto-first-message/index.ts` | Idem — unificar antes de verificar `auto_first_message_sent` |
| `src/components/FormSection.tsx` | Adicionar `supabase.rpc("unify_lead", ...)` após insert |
| `src/components/goldenview/GVFormSection.tsx` | Idem |
| `src/components/mauriciocardoso/MCFormSection.tsx` | Idem |

### Detalhes técnicos

**Nas edge functions** (mais importante — cobre todos os casos):
```typescript
// Após buscar o lead, antes de criar a cadência:
const { data: unifiedId } = await supabase.rpc("unify_lead", { _new_lead_id: leadId });
const effectiveLeadId = unifiedId || leadId;

// Se unificou, re-buscar o lead com o ID correto
if (effectiveLeadId !== leadId) {
  // Re-fetch lead data with the unified ID
  const { data: unifiedLead } = await supabase.from("leads")...eq("id", effectiveLeadId);
  // Verificar se já tem cadência ativa (o lead antigo pode já ter)
}
```

**Nas landing pages** (fallback para quando nenhuma automação está ativa):
```typescript
// Após insert + attribution, non-blocking:
supabase.rpc("unify_lead", { _new_lead_id: leadId }).catch(() => {});
```

Isso resolve o cenário atual (4 cards do Maicon) e previne futuros duplicados em qualquer landing page.


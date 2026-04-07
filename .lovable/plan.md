

## Plan: Fix "Iniciar Atendimento" Not Showing Message Input for Brokers

### Problem

When Márcio clicks "Iniciar Atendimento" in the Plantão, the message input field doesn't appear. The most likely cause is that the `leads` insert fails silently (RLS policy or constraint), triggering an early return at line 192-194 of `BrokerPlantao.tsx`. When this happens:
- `setInboxTab("meus")` never executes
- `isNewLeadConversation` remains `true`  
- The UI continues showing "Inicie o atendimento para enviar mensagens" instead of the input

A secondary issue: even if the insert succeeds, the flow has a fragile dependency chain (insert lead → unify → update conversation → insert interaction → insert system message) where any failure after the early return causes partial state.

### Fix

**1. Restructure `handleStartAttendance` in `BrokerPlantao.tsx` to be more resilient**

- Move `attendance_started = true` and `setInboxTab("meus")` BEFORE the lead creation, so the broker can start typing immediately even if CRM card creation has issues
- If the conversation update succeeds but lead creation fails, still allow messaging (the conversation is claimed)
- Show specific error messages for each step that fails, rather than silently returning

**2. Same fix in `AdminPlantao.tsx`**

- Apply the same restructuring to keep both flows consistent

### Technical details

The key change is reordering the flow:

```
Step 1: Update conversation (attendance_started=true, broker_id) → switch to "meus" tab immediately
Step 2: Create lead in CRM (async, non-blocking for messaging)
Step 3: Link lead to conversation, insert interactions and system message
```

If Step 1 succeeds, the broker can message. Steps 2-3 can show warnings on failure without blocking the input.

Both files (`BrokerPlantao.tsx` and `AdminPlantao.tsx`) will be updated with the same pattern. No database changes needed.




## Plan: Allow Admin to Send Messages from "Outros" Tab

### Problem

When the admin views a conversation in the "Outros" tab of the Plantão de Vendas, the input box is hidden and replaced with "Modo supervisão — somente leitura". This prevents the admin from responding to any conversation that belongs to another broker.

The root cause is line 252 in `AdminPlantao.tsx`:
```typescript
const isReadOnlyConversation = inboxTab === "outros";
```

This unconditionally makes all "Outros" conversations read-only — which makes sense for brokers but not for admins who need full supervisory control.

### Fix

**File: `src/pages/AdminPlantao.tsx` (1 line change)**

Change the read-only logic so admins are never restricted:
```typescript
// Before:
const isReadOnlyConversation = inboxTab === "outros";

// After:
const isReadOnlyConversation = false;
```

Since this is the **Admin** Plantao page, the admin should always be able to respond. The "Outros" tab's purpose for admins is to see other brokers' conversations — but they should still be able to intervene and send messages when needed.

No other files need changes. The broker version (`BrokerPlantao.tsx`) correctly keeps read-only on "Outros" since brokers should not message other brokers' leads.


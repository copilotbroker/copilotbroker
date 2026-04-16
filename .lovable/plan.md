

# Root Cause Analysis & Fix: Auto-Create Kanban Card on First Reply

## What Happened

The lead **Hosana** sent a message via the **WhatsApp Global (Plantão)**. The broker **Gabriel** replied directly to the message without clicking the "Iniciar Atendimento" button. The database trigger `update_conversation_on_message` correctly set `attendance_started = true` on the first outbound message, moving the conversation to the "Meus/Atendimento" tab — but **no lead card was created** because card creation only happens through the explicit UI button.

## The Gap

There's a disconnect between two paths:
- **Path A (Button):** Broker clicks "Iniciar Atendimento" → creates lead, links conversation, logs interaction ✅
- **Path B (Direct Reply):** Broker just types and sends a message → conversation marked attended, but NO lead created ❌

Path B is a common real-world scenario — brokers often reply quickly without clicking extra buttons.

## Proposed Fix

Auto-create a Kanban card when a broker sends the **first outbound message** to any conversation that has `lead_id = NULL`. This applies to both:
- **Plantão (Global)** — `BrokerPlantao.tsx`, `AdminPlantao.tsx`
- **Inbox Pessoal** — `BrokerInbox.tsx`, `AdminInbox.tsx`

### Implementation

1. **Modify the `sendMessage` callback** in each inbox page (or centralize in `useConversationMessages`) to check: if `conversation.lead_id` is null and this is the first outbound message, automatically run the same logic as `handleStartAttendance`:
   - Insert a new lead with `name = display_name || phone`, `source = conversation.source_instance`, `lead_origin` based on instance type
   - Call `unify_lead` RPC
   - Update `conversation.lead_id`
   - Log `atendimento_iniciado` interaction

2. **Files to modify:**
   - `src/hooks/use-conversations.ts` — Add an optional `onAutoCreateLead` callback parameter to `useConversationMessages`, triggered on first outbound when `lead_id` is null
   - `src/pages/BrokerInbox.tsx` — Pass auto-create handler
   - `src/pages/BrokerPlantao.tsx` — Pass auto-create handler
   - `src/pages/AdminInbox.tsx` — Pass auto-create handler
   - `src/pages/AdminPlantao.tsx` — Pass auto-create handler

3. **Guard against duplicates:** Only trigger if `conversation.lead_id` is still null at the moment of send (check DB before insert).

### Technical Detail

The auto-creation will reuse the existing `handleStartAttendance` logic pattern:
```
insert lead → unify_lead RPC → update conversation.lead_id → log interaction
```

The lead will inherit:
- `name`: from `conversation.display_name` or phone
- `source`: `whatsapp` for personal, `whatsapp_global` for global
- `lead_origin`: `whatsapp_direto` for personal, `whatsapp_plantao` for global
- `broker_id`: the current broker
- `status`: `info_sent`


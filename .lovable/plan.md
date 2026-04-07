

## Plan: Add Attendance History Messages and Broker Attribution Visibility

### What the user needs

1. **System message in conversation when attendance starts** — When a broker clicks "Iniciar Atendimento", insert a visible system message into the conversation thread (e.g., "✅ Davi Santiago iniciou o atendimento — 6 de abril, 15:20") so there's a clear audit trail inside the chat.

2. **Show assigned broker info in the conversation list and thread header** — In the Plantão inbox (especially for admins), display which broker is assigned to each conversation and whether attendance has been started, so the admin can immediately see attribution status.

### Changes

**1. Insert system message on "Iniciar Atendimento" (AdminPlantao.tsx + BrokerPlantao.tsx)**

After the `handleStartAttendance` function creates the lead and records the interaction, also insert a `conversation_messages` record with:
- `direction: "outbound"`, `sent_by: "system"`, `content: "✅ {brokerName} iniciou o atendimento"`
- `metadata: { system_event: "attendance_started", broker_name: brokerName }`

This makes the event visible inside the chat thread. Both AdminPlantao and BrokerPlantao `handleStartAttendance` functions get this addition.

**2. Fetch broker name alongside conversations (use-conversations.ts)**

Update the conversation query to join the broker table:
```sql
broker:brokers!conversations_broker_id_fkey(id, name)
```

Add `broker?: { id: string; name: string } | null` to the `Conversation` interface.

**3. Show broker name in ConversationList items (ConversationList.tsx)**

For conversations in the Plantão (where `source_instance === "global"`), add a badge showing the assigned broker's name below the existing badges:
- If `attendance_started === true` and broker name exists: green badge "👤 Davi Santiago — Atendendo"
- If `attendance_started === false`: orange badge "⏳ Aguardando atendimento"

**4. Show broker info in ConversationThread header (ConversationThread.tsx)**

In the header area (below the phone/badges), when `source_instance === "global"` and there's an assigned broker, display:
- Badge: "Atribuído a: {broker.name}"
- If `attendance_started`: "Attending" status badge (already partially exists but needs broker name)

**5. Render system messages distinctly in ConversationThread (ConversationThread.tsx)**

Messages with `sent_by === "system"` should render as centered, muted system messages (like date separators) instead of chat bubbles — similar to "WhatsApp: Messages are end-to-end encrypted" style.

### Technical details

- The `conversation_messages` insert for system events uses `sent_by: "system"` which is already a valid value in the schema.
- The broker join uses the existing `broker_id` FK on conversations. RLS already allows admins to see all brokers.
- No database migration needed — just frontend changes and an extra insert call.
- The `Conversation` interface update propagates to all consumers but the new `broker` field is optional, so no breaking changes.


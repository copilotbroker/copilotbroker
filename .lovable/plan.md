

## Plan: Fix "Novos" Tab Showing Already-Attended Conversations

### Problem

The "Novos" tab shows 22 conversations, but some already have broker activity (outbound messages sent, leads linked). The `attendance_started` flag only gets set when someone clicks "Iniciar Atendimento" in the UI. However, brokers can respond via auto-messages or directly through the global instance without clicking that button, leaving `attendance_started = false` even though the conversation is actively being handled.

Database evidence: 6 conversations have outbound messages but `attendance_started = false`. 2 conversations have linked `lead_id` but `attendance_started = false`.

### What changes

**1. Database migration — Fix the trigger `update_conversation_on_message`**

Update the existing trigger function so that when an outbound message is inserted on a `source_instance = 'global'` conversation, it automatically sets `attendance_started = true`. This ensures any broker reply (manual, auto-message, or campaign) marks the conversation as attended.

```sql
-- Inside update_conversation_on_message, add:
attendance_started = CASE 
  WHEN NEW.direction = 'outbound' AND source_instance = 'global' 
  THEN true 
  ELSE attendance_started 
END
```

**2. Database migration — Fix existing stale data**

Run a one-time update to mark conversations as attended when they already have outbound messages or a linked lead:

```sql
UPDATE conversations SET attendance_started = true
WHERE source_instance = 'global' AND attendance_started = false
AND (
  lead_id IS NOT NULL
  OR id IN (
    SELECT DISTINCT conversation_id FROM conversation_messages WHERE direction = 'outbound'
  )
);
```

**3. No frontend changes needed**

The query in `use-conversations.ts` already filters correctly on `attendance_started = false`. Once the data and trigger are fixed, the "Novos" tab will only show genuinely unattended conversations.

### Technical details

- The trigger `update_conversation_on_message` fires on every message insert and already updates `last_message_at`, `unread_count`, `status`, and `display_name`. Adding the `attendance_started` flip for outbound global messages is a natural extension.
- The data fix migration handles the ~6-8 conversations currently stuck in the wrong state.
- No RLS or schema changes required.




## Plan: Ensure "Novos" Tab Behavior in Plantao and Inbox

### Current state

The system **already implements** the described behavior:

- **"Novos" tab** in Plantao (both admin and broker) filters by `attendance_started = false` — only showing conversations where no broker has claimed attendance
- **"Iniciar Atendimento"** sets `attendance_started = true` and assigns `broker_id` to the claiming broker, which removes the conversation from "Novos" and makes it appear in "Meus"
- The transition includes automatic tab switch to "Meus" after claiming

### Identified issues to fix

1. **AdminInbox defaults to "meus" tab but has no "novos" query hook** — Unlike AdminPlantao, AdminInbox doesn't have a separate `novosConversations` hook, so the novos tab count and list may not work correctly there.

2. **BrokerInbox has no tab system at all** — It only shows personal instance conversations with no novos/meus tabs. Since BrokerInbox is for the broker's personal WhatsApp (not global), the "novos" concept doesn't apply the same way. However, the user wants consistency.

3. **Potential double-filter on source_instance** — The "novos" query already applies `source_instance = 'global'`, and then the `sourceInstance: "global"` option applies it again. This is harmless but redundant.

### What changes

**File: `src/pages/AdminInbox.tsx`**
- Add a dedicated `novosConversations` hook (matching AdminPlantao pattern) so the "Novos" tab properly queries `attendance_started = false` with `userRole: "admin"`
- Use `novosConversations` when `inboxTab === "novos"` and the correct loading state
- Show novos count badge on the tab

**File: `src/pages/BrokerInbox.tsx`**
- No changes — BrokerInbox is for personal instance conversations where the attendance concept doesn't apply. The user's personal WhatsApp messages go directly to their inbox without a claim flow.

**File: `src/hooks/use-conversations.ts`**
- Skip the redundant `sourceInstance` filter when `inboxTab === "novos"` (already filtered by `source_instance = 'global'` in the novos logic)

### Technical details

The core query in `use-conversations.ts` line 181 already enforces:
```sql
WHERE source_instance = 'global' AND attendance_started = false
```

The `handleStartAttendance` in both AdminPlantao and BrokerPlantao correctly:
1. Updates `attendance_started = true` and `broker_id = claimingBrokerId`
2. Creates a lead in the CRM with status `info_sent`
3. Switches the UI to the "Meus" tab
4. Refreshes both conversation lists

The AdminInbox fix ensures the same pattern works when admins use the Inbox view (not just Plantao).




## Plan: Fix Admin Plantao Visibility and Experience

### Problem identified

The admin cannot see leads/conversations that arrived for the team. After analyzing the code, there are several interconnected bugs in `AdminPlantao.tsx` and the `useConversations` hook:

### Issues found

1. **"Novos" tab filters by admin's own broker ID** — The novos hook passes `brokerId: myBrokerId`. In `useConversations`, the "novos" query then applies `broker_id.eq.${myBrokerId} OR roleta_modo.eq.disputa`, meaning the admin only sees conversations assigned to *themselves* or in "disputa" mode. Conversations assigned to other brokers via round-robin (fila mode) are invisible to the admin.

2. **"Meus" tab defaults to admin's own broker** — After init, `selectedBrokerId` is set to `brokerIdFound` (the admin's broker profile). So the "Meus" tab initially shows only the admin's own conversations, not the full team view.

3. **Loading state is always from the main hook** — `activeLoading` uses `isLoading` from the main `useConversations` hook even when on the "novos" tab, which uses the separate `novosConversations` hook. This can show stale or incorrect loading state.

4. **Admin's novos hook doesn't leverage admin role** — The hook doesn't know the user is an admin, so it applies broker-scoped filtering instead of showing all unattended global conversations.

### What changes

**File: `src/pages/AdminPlantao.tsx`**
- Pass no `brokerId` to the novos hook (admin should see ALL unattended global conversations, not just their own)
- Change `selectedBrokerId` default to `"all"` instead of the admin's own broker ID, so the "Meus" tab starts with a full team view
- Use the correct loading state from the novos hook when on the "novos" tab
- Pass `userRole: "admin"` to the novos hook for proper context

**File: `src/hooks/use-conversations.ts`**
- In the "novos" tab query logic, when `userRole` is `"admin"`, skip the broker/roleta_modo filter entirely — admin sees all pending global conversations
- Add `userRole` to the novos query logic so admin visibility is not restricted by roleta membership

### Technical details

In `useConversations`, the novos query currently does:
```
query.eq("source_instance", "global").eq("attendance_started", false)
if (brokerId) query.or(`broker_id.eq.${brokerId},roleta_modo.eq.disputa`)
```

For admin, the broker filter should be skipped entirely. The fix adds a check: if `userRole === "admin"`, don't apply the broker/disputa filter. RLS already grants admins full SELECT access.

In `AdminPlantao`, the novos hook changes from:
```
brokerId: myBrokerId || undefined
```
to:
```
brokerId: undefined  // admin sees all
userRole: "admin"
```

And `selectedBrokerId` initializes to `"all"` so the broker selector starts on the team-wide view.


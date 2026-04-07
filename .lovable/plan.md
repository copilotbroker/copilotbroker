

## Plan: Allow Leaders to Send Messages from "Outros" Tab

### Problem

Leaders (`isLeader === true`) use `BrokerPlantao.tsx` which has `isReadOnlyConversation = inboxTab === "outros"`. Leaders can see other brokers' conversations via the "Outros" tab but cannot respond — they get the same "Modo supervisão — somente leitura" message. Leaders should have supervisory control similar to admins.

### Fix

**File: `src/pages/BrokerPlantao.tsx` (1 line change)**

```typescript
// Before:
const isReadOnlyConversation = inboxTab === "outros";

// After:
const isReadOnlyConversation = inboxTab === "outros" && !isLeader;
```

Leaders get write access on "Outros"; regular brokers remain read-only. The `isLeader` variable is already available (line 36).

**File: `src/pages/AdminInbox.tsx` (1 line change)**

Same fix for the Admin Inbox, which also has this restriction:

```typescript
// Before:
const isReadOnlyConversation = inboxTab === "outros";

// After:
const isReadOnlyConversation = false;
```

No other files need changes.


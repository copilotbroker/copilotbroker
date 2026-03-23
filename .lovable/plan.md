

# Fix: Bottom nav overlapping page content on mobile

## Problem
The bottom navigation bar (`BrokerBottomNav`, fixed at `z-50`) covers content at the bottom of the page because `pb-20` is applied to the **parent flex container** instead of the **scrollable `<main>`** element. Since `<main>` has `overflow-y-auto`, it creates its own scroll context, and the parent's padding does not create space inside it.

## Fix

**File: `src/components/broker/BrokerLayout.tsx`**

Move `pb-20 lg:pb-0` from the outer `div` to the `<main>` element:

```
// Before:
<div className="lg:ml-16 h-screen flex flex-col pb-20 lg:pb-0 overflow-hidden">
  ...
  <main className="flex-1 min-h-0 overflow-y-auto p-3 lg:p-6">

// After:
<div className="lg:ml-16 h-screen flex flex-col overflow-hidden">
  ...
  <main className="flex-1 min-h-0 overflow-y-auto p-3 pb-20 lg:p-6 lg:pb-6">
```

This ensures the bottom padding is inside the scrollable area, so the user can scroll past the bottom nav to see all content.


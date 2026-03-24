

# Fix: Google Calendar connection not opening on mobile

## Problem
`window.open()` with popup parameters (`width=500,height=600`) is blocked by mobile browsers. Mobile Safari and Chrome block popups that aren't directly triggered by user interaction, and even when allowed, popup windows don't work well on mobile.

## Solution
Detect mobile and use `window.location.href` (full redirect) instead of popup. After the OAuth callback, redirect back to the agenda page.

### File: `src/hooks/use-calendar-events.ts`

1. Replace `window.open(data.url, ...)` with mobile detection logic:
   - If mobile viewport (`window.innerWidth < 768`): use `window.location.href = data.url` (full page redirect)
   - If desktop: keep existing popup behavior

2. Update the callback HTML in `supabase/functions/google-calendar-auth/index.ts`:
   - Instead of only `window.opener.postMessage` + `window.close()`, also handle the case where there's no `window.opener` (i.e., full redirect on mobile)
   - In that case, redirect back to `/corretor/agenda` with a success query param

3. Handle return from redirect in `AgendaModule.tsx`:
   - On mount, check for `?google=success` in URL
   - If present, show toast and remove the query param

### Files changed
- `src/hooks/use-calendar-events.ts` — mobile redirect instead of popup
- `supabase/functions/google-calendar-auth/index.ts` — callback handles redirect case
- `src/components/agenda/AgendaModule.tsx` — detect redirect return


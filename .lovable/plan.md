

## Plan: Integrate VivaPark as a CRM Project

The VivaPark landing page currently submits leads but the project doesn't exist in the `projects` database table, and there's no broker landing page or terms page. This plan adds full CRM integration following the same pattern as NAU and GoldenView.

### What changes

**1. Insert the VivaPark project into the database**
- Use the insert tool to add a row to `projects` with `name: "Vivapark Porto Belo"`, `slug: "vivapark"`, `city_slug: "portobelo"`, `is_active: true`.

**2. Create a broker landing page (`VivaParkBrokerLandingPage.tsx`)**
- New file at `src/pages/vivapark/VivaParkBrokerLandingPage.tsx`
- Follows the NAU broker pattern: reads `:brokerSlug` from URL, fetches project by `city_slug`+`slug`, validates broker and `broker_projects` association, then renders the same VivaPark page with the broker's ID passed to the form.
- The existing `VivaParkLandingPage` will be refactored slightly to accept optional `brokerId` and `brokerName` props so it can be reused by the broker page.

**3. Create a terms page (`TermosVivaPark.tsx`)**
- New file at `src/pages/vivapark/TermosVivaPark.tsx` with standard terms/privacy content (same structure as `TermosNAU`).

**4. Add routes to `App.tsx`**
- `/portobelo/vivapark/:brokerSlug/obrigado` → `VivaParkBrokerLandingPage`
- `/portobelo/vivapark/:brokerSlug` → `VivaParkBrokerLandingPage`
- `/portobelo/vivapark/termos` → `TermosVivaPark`

**5. Update `VivaParkLandingPage.tsx` form section**
- Accept optional `brokerId` prop to support broker context
- When `brokerId` is set, pass it to the lead insert and set `source: "broker_landing"`
- Add terms links pointing to `/portobelo/vivapark/termos`

### Technical details

- The project fetch in the existing page (`projects.select("id").eq("slug", "vivapark")`) will work once the DB row exists.
- The broker page validates the broker-project association via `broker_projects` table before rendering, redirecting to the main page if invalid.
- No database schema changes needed -- only a data insert into the existing `projects` table.


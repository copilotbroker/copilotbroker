

## Problem

The Monaco landing page was built as a custom hardcoded page (`MonacoLandingPage`), not through the dynamic CRM system. There is no broker route for Monaco in the router.

When a broker adds Monaco to their portfolio, the system generates URLs like `/xangrila/monaco/davi`. This URL falls through to the catch-all route `/:citySlug/:projectSlug/:brokerSlug`, which renders `ProjectBrokerLandingPage` -- a generic layout with Estancia Velha sections (Header, HeroSection, etc.) instead of the custom Monaco design. The page either looks wrong or redirects away.

## Solution

Follow the same pattern used for NAU, VivaPark, and Mauricio Cardoso: create a dedicated `MonacoBrokerLandingPage` component and add broker routes in the router.

### Changes

1. **Create `src/pages/monaco/MonacoBrokerLandingPage.tsx`**
   - Accepts `brokerSlug` from URL params
   - Fetches the Monaco project from `projects` table (slug=monaco, city_slug=xangrila)
   - Fetches the broker by slug and validates `broker_projects` association
   - Renders the full Monaco layout (all custom Monaco sections) with `brokerId` passed to `MonacoFormSection`
   - Includes SEO metadata and Facebook Pixel (same as the main Monaco page)

2. **Update `src/App.tsx`**
   - Import `MonacoBrokerLandingPage`
   - Add two routes right after the existing Monaco routes (before the catch-all):
     ```
     /xangrila/monaco/:brokerSlug/obrigado → MonacoBrokerLandingPage
     /xangrila/monaco/:brokerSlug → MonacoBrokerLandingPage
     ```

This ensures broker links render the full custom Monaco design with proper lead attribution to the broker.


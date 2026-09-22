# Campaigns

Admin management of campaigns (internal announcements). `campaigns-manager.tsx` lists/creates/edits campaigns, rendered by `app/(dashboard)/campaigns`.

## Add a new campaign field

1. Add the field to the API side first: `apps/api/src/features/campaigns/campaigns.service.ts`'s request/response shape (see that feature's `AGENTS.md`).
2. Add the field to `campaigns-manager.tsx`'s form and list rendering.
3. If `apps/web`'s `features/campaigns/campaign-signup-form.tsx` also collects this field, update it too — the two forms aren't wired together, they just happen to hit the same API.

## Notable dependencies
`features/api-target` (API client), `campaigns` feature of `apps/api`.

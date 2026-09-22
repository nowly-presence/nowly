# Campaigns

Campaigns (internal announcements) and their public sign-up form.

- `GET /` (admin) — list campaigns with `signupCount`.
- `POST /` (admin) — create a campaign by `name`.
- `GET /:id/signups` (admin) — list a campaign's signups.
- `POST /:id/signups` (public, rate-limited 5/min) — record a signup; this is what `apps/web`'s `campaign-signup-form.tsx` and `apps/insights`'s campaign manager post to.

## Add a new campaign field (e.g. a target URL)

1. Add the column to the Prisma `Campaign` model and run a migration.
2. Add it to `createCampaign` in `campaigns.service.ts` (currently only takes `name`) and to the corresponding `Body` type in `campaigns.routes.ts`'s `POST /`.
3. `listCampaigns` already spreads the full Prisma row (`...campaign`), so a new column shows up in `GET /` automatically — no change needed there.
4. Update both consumers: `apps/web/features/campaigns/components/campaign-signup-form.tsx` and `apps/insights/features/campaigns/components/campaigns-manager.tsx` — they aren't wired to each other, each needs the field added separately.

## Add validation to the signup form

Edit `recordSignup` in `campaigns.service.ts` — it currently only checks email format (`EMAIL_RE`) and length, then upserts by `(campaignId, email)` so a repeat signup is a silent no-op (not an error). Add new checks before the `upsert` call, returning `{ ok: false }` on failure (the route maps that to a `400 INVALID_EMAIL_OR_CAMPAIGN`).

## Notable dependencies
`requireAdmin` (from the `auth` feature) guards every admin route here — the signup endpoint is the one deliberately public route. Consumed by `apps/insights` (admin) and `apps/web` (public signup).

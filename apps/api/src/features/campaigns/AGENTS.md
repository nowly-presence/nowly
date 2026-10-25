# Campaigns

Generic campaigns and their signups. The admin UI lives in `apps/web`; the API retains its generic public signup contract.

- `GET /` (admin) — list campaigns with `signupCount`.
- `POST /` (admin) — create a campaign by `name`.
- `GET /:id/signups` (admin) — list a campaign's signups.
- `POST /:id/signups` (public, rate-limited 5/min) — record a signup; there is no current public form in `apps/web`.

## Add a new campaign field (e.g. a target URL)

1. Add the column to the Prisma `Campaign` model and run a migration.
2. Add it to `createCampaign` in `campaigns.service.ts` (currently only takes `name`) and to the corresponding `Body` type in `campaigns.routes.ts`'s `POST /`.
3. `listCampaigns` already spreads the full Prisma row (`...campaign`), so a new column shows up in `GET /` automatically — no change needed there.
4. Update `apps/web/features/campaigns/campaigns-manager.tsx` when the field belongs in the admin UI; API fields are not automatically wired into its controls.

## Add validation to public signups

Edit `recordSignup` in `campaigns.service.ts` — it currently only checks email format (`EMAIL_RE`) and length, then upserts by `(campaignId, email)` so a repeat signup is a silent no-op (not an error). Add new checks before the `upsert` call, returning `{ ok: false }` on failure (the route maps that to a `400 INVALID_EMAIL_OR_CAMPAIGN`).

## Notable dependencies
`requireAdmin` (from the `auth` feature) guards every admin route here — the signup endpoint is the one deliberately public route. Administration lives at `/[locale]/admin/campaigns` in `apps/web`, with an additional server-side session gate.

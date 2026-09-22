# Campaigns

`campaign-signup-form.tsx` — a sign-up form posting to `apps/api`'s `campaigns` feature (`POST /`).

## Add a new form field

1. Add the field to the form in `campaign-signup-form.tsx`.
2. Add the matching field to the request body schema on the API side (`apps/api/src/features/campaigns/campaigns.service.ts` — the endpoint validates the body, an extra client-side field with no server-side counterpart is silently dropped).
3. If the field needs to show up in `apps/insights`'s campaign manager (`features/campaigns` there), add it to that view too — the two aren't wired together automatically.

## Notable dependencies
`campaigns` feature of `apps/api`.

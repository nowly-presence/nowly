# Campaigns

Generic campaign administration lives in `campaigns-manager.tsx`, mounted at `/[locale]/admin/campaigns`. The page checks the Discord admin session on the server; the API independently guards every admin operation. `admin-login.tsx` reuses the account feature's login helpers.

## Add a new campaign field

1. Update the Prisma model and the matching validation/service in `apps/api/src/features/campaigns`.
2. Update the request/response types and controls in `campaigns-manager.tsx`; fields are not automatically wired into the UI.
3. Keep both the server page's session gate and the API admin guards. The generic public signup endpoint remains in the API, but this feature no longer contains a public signup form.

## Notable dependencies
`campaigns` feature of `apps/api`.

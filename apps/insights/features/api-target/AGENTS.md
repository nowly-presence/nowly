# API Target

Lets the dashboard switch which `apps/api` environment it talks to (prod, staging, local...). `api-target-switcher.tsx` is the UI (sidebar + login page), `lib/api-target.ts` resolves/persists the current target, `lib/api-client.ts` is the shared HTTP client every other feature must go through.

## Add a new available environment

1. Add the environment to whatever list `lib/api-target.ts` resolves targets from (a fixed array or env-var-driven list — check the top of that file).
2. Add its base URL via an env var if it's not derivable from the existing ones, and document it in `apps/insights/.env.example`.
3. `api-target-switcher.tsx` renders whatever `lib/api-target.ts` exposes — no separate UI registration.

## Use the API client correctly

Always call the API through `lib/api-client.ts`'s exported client function, never `fetch` directly — it applies the currently selected target's base URL and auth headers. A direct `fetch` call bypasses the switcher silently (it'll always hit whatever `apps/api` your `.env` originally pointed to, ignoring anything the user picked in the UI).

## Notable dependencies
Consumed by `campaigns`, `views`, `chat`, `layout`. `lib/session.ts` (root) for request auth.

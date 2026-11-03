# Account space (account.nowly.me)

Private, `noindex` Next.js app for signed-in users: profile, devices, synced presences, creations with their review thread, public page settings and, for staff, the review queue. It only calls the API; it has no database access.

## Layout

- `app/[locale]/(secure)/*`: every route that needs a session. The layout reads `/me` on the server with the request cookie (`lib/server-session.ts`) and redirects to `/sign-in`. The API still re-checks session and role on every call: the guard only avoids rendering for anonymous visitors.
- `app/[locale]/connect`: extension sign-in (`?permission=creator|admin`, `source=extension`, `device`). Public, handles its own sign-in. `admin` requests scopes `sync` and `admin` and is refused for accounts without a role. `nowly.me/extension/connect` stays for extension builds that only trust `nowly.me`.
- Shell: the shared `@nowly/ui` navbar (`site="account"`, account tabs in its mobile sheet, tab row on desktop) and footer. Tabs live in `features/shell/lib/account-tabs.ts`, filtered by capability (`review`, `manage` for the Users tab that searches accounts and grants the verified badge).
- Public page: the handle is created by the API from the Discord username and never typed by the user.
- `features/account`: views and API clients (`lib/account-api.ts`, `lib/submission-api.ts`). `features/shell`: header and navigation.
- Strings live in `packages/locales/messages/account` (11 locales). `scripts/check-i18n-unused.ts` covers this catalog.

## Security

- Headers and CSP are in `next.config.ts`: `connect-src` allows only the API origin, `frame-ancestors 'none'`, HSTS in production. Scripts need `'unsafe-inline'` for the Next and next-themes inline scripts; a nonce through the proxy is a possible hardening.
- The session cookie is Better Auth's, shared on `.nowly.me`. The API trusts this origin through `ACCOUNT_URL` (CORS, CSRF origin check, sign-in redirects). Locally the API trusts `localhost:3003`.
- Submission text and creator definitions are user input: render as plain text only, never as HTML. Links come only from the API.
- Destructive actions keep `window.confirm` (delete account, unlink device, publish).

## Env

`NEXT_PUBLIC_API_BASE_URL` (default `https://api.nowly.me`), `NEXT_PUBLIC_BASE_URL` (default `https://nowly.me`, for links back to the site), `NEXT_PUBLIC_SUBMISSION_IMAGES_ORIGIN` (default `https://cdn.nowly.me`, CSP image source for submission images).

## Dev

`pnpm --filter @nowly/account dev` (http://localhost:3003, bind `localhost`). Checks: `npx tsc --noEmit`, `npx eslint .`, `next build`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

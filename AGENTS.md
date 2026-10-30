# Nowly monorepo

Discord Rich Presence manager: the extension runs presence scripts and the native host relays their activity to Discord. Nested `AGENTS.md` files are authoritative for their directory; this file only holds repo-wide rules.

## Layout

- pnpm workspace (`apps/*`, `packages/*`), Node >= 22.22.1, pnpm version pinned in `packageManager`.
- Apps: `api` (Fastify), `web` (nowly.me), `docs`, `extension` (MV3, Chromium and Firefox), `native` (Go host). `apps/discord` is git-ignored and absent from fresh clones.
- Shared packages: `env`, `shared`, `telemetry`, `ui`, `locales`, `changelog`, `og`.
- `packages/{sdk,cli,presences,internal-cli}` are separate repositories, not part of this one: optional local clones (`pnpm repos`), git-ignored and outside the workspace. Commit and open pull requests from inside them; CI never has them. Presence authoring rules live in the presences repository's `AGENTS.md`.

## Commands

- `pnpm install`. Never regenerate `pnpm-lock.yaml` unless dependencies changed. Locally, `prepare` also installs the git hooks and clones missing `sdk`, `cli` and `presences` (`scripts/repos.ts`; skipped in CI, Docker or with `NOWLY_SKIP_REPOS=1`).
- Dev: `pnpm dev:api`, `pnpm dev:web`, `pnpm dev:docs`, `pnpm --filter @nowly/extension dev`.
- Checks: no root aggregator. Run only the touched workspace with `pnpm --filter @nowly/<pkg> <script>`; scripts differ per package, read its `package.json`. API tests need `pnpm --filter @nowly/api prisma:generate` first (any `DATABASE_URL`). Native host: `go test ./...` in `apps/native`.
- Formatting: `pnpm format`. Never hand-format or add Prettier overrides. The pre-commit hook formats staged TypeScript in `apps/` and `packages/`.
- Root script tests: `pnpm test:format`, `pnpm test:repos`. Unused i18n keys: `node --experimental-strip-types scripts/check-i18n-unused.ts`.
- Commits: Conventional Commits `type(scope): summary`, enforced by the commit-msg hook and CI.

## CI

- Pull requests: `test-api.yml` (API and telemetry), `i18n-unused.yml`, `commit-message.yml`. Push to `stable`: `lint.yml` (web, docs, extension), `test-api.yml`, `canary-extension.yml` (extension changes). Manual: `production-extension.yml`, `presence-backfill.yml`. `host-release.yml` runs on `native-vX.Y.Z` tags.
- Nothing runs the formatter, env tests or `go test` outside the release workflow: run them yourself when relevant.
- A workflow needing the private internal CLI checks it out at `packages/internal-cli` (its code resolves the monorepo as `../..`) with `INTERNAL_CLI_PAT`.

## Cross-app rules

- Env: import only your context's `@nowly/env/<server|client|extension>`, never another one.
- i18n: 11 locales. Every user-visible string exists in all of them (see `packages/locales/AGENTS.md`).
- Navbar and footer come from `packages/ui`; never fork them in an app.
- Legal document dates come only from `tos-page.last-updated` and `privacy-page.last-updated` in `packages/locales/messages/web/en-US.json` (see `apps/web/features/legal/AGENTS.md`).
- Extension IDs are duplicated: change every copy together (`git grep` the ID). Both prod `kmnlnfldimgneaopdihplkebobckcjpf` and dev `abbegmindbabanjcabnmcjmamaoffbam` are allow-listed in `apps/native` (`cmd/host/main.go`, `installer.iss`, `scripts/install-linux.sh`, `scripts/install-macos.sh`, `scripts/build-deb.sh`); the prod ID is also in the extension, web, docs and `packages/env` constants and `apps/web/Dockerfile`, the dev manifest key in `apps/extension/manifest.config.ts`.
- `canonicalJson` (`@nowly/shared`) is used by the API to sign releases and by the extension to verify them: it must stay byte-identical.
- Button-styled links (web, docs, `packages/ui`): put `buttonVariants()` on the real `Link`/`<a>`, inside a Client Component. Never wrap navigation in `<Button>` (`render`, `asChild`, `nativeButton={false}`) and never call `buttonVariants()` in a Server Component. `<Button>` is for actions that do not change the URL.

## Presences and releases

- Presences are written against `@nowly/sdk`, validated with the `nowly` CLI and published by the presences repository CI through the private internal CLI.
- The internal CLI has no root script: run it from its checkout with `npx tsx index.ts <command>`. `apps/native/scripts/publish-prod.*` find it through `INTERNAL_CLI_DIR` (default `packages/internal-cli`).
- Native host: message contract in `apps/native/internal/contract/messages.go`; release by tagging `native-vX.Y.Z`.

## Privacy

- No activity data leaves the user's machine.
- Product events go through `@nowly/telemetry` (closed event schema, sent only with consent). Never add properties carrying page titles, URLs, media metadata, device IDs or activity content.

## Vendored skills

Skills listed in `skills-lock.json` are vendored under `.agents/skills/`: never edit them. `nowly-web-page` is a local skill outside the lockfile.

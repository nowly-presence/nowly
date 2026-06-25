# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Nowly** is a Discord Rich Presence manager with a monorepo structure. It consists of:

- **Browser extension** (@nowly/extension) — Chromium-based extension that runs presence scripts on websites
- **Web app** (@nowly/web) — Next.js frontend for user dashboard, settings, and presence management
- **API** (@nowly/api) — Fastify server handling authentication, presence storage, stats, and CDN integration
- **Native host** (apps/native) — Go-based native messaging host for Discord Rich Presence communication
- **Presence CLI & SDK** (packages) — Tools for creating, building, and validating presence scripts
- **Shared packages** — Environment configuration (@nowly/env), presence types (@nowly/presence), and website data (@nowly/websites)

The system works by: users create presence scripts → CLI builds & validates them → extension loads & executes them in background → native host communicates with Discord via IPC.

## Monorepo Structure (pnpm workspaces)

```
apps/
  api/           # Fastify server (Node.js)
  web/           # Next.js 16 frontend
  extension/     # Chromium extension (Vite + React)
  native/        # Native host (Go, cross-platform)

packages/
  env/           # Typed environment variables (t3-oss/env-core)
  presence/      # Presence SDK types & utilities
  websites/      # Presence metadata, CLI for building/managing presences
  internal-cli/  # Admin CLI for publishing (Cloudflare R2, CDN)
```

Root `pnpm-workspace.yaml` includes all workspaces. Use `pnpm --filter @nowly/PACKAGE` to run commands on specific packages.

## Development Commands

### Setup & Installation
```bash
pnpm install                    # Install all dependencies (respects pnpm-lock.yaml)
```

### Development Servers
```bash
pnpm dev:web                    # Start Next.js dev server (localhost:3000)
pnpm dev:api                    # Start Fastify API with tsx watch (localhost:3001)
pnpm build:extension:dev        # Build extension for development (use --watch for live rebuild)
```

### Building
```bash
pnpm build:websites             # Build presence definitions from src/ to dist/
pnpm build:extension            # Build optimized extension (production)
pnpm build:extension:dev        # Build extension with dev tweaks
pnpm build:macos                # Build native host macOS .app bundles + DMGs
```

### Testing
```bash
pnpm --filter @nowly/api test         # Run API tests (vitest)
pnpm --filter @nowly/api test:watch   # Watch mode
pnpm --filter @nowly/env test         # Env package tests
pnpm --filter @nowly/websites test    # Websites package tests
```

### Linting & Type Checking
```bash
pnpm --filter @nowly/web lint         # ESLint on web app
pnpm --filter @nowly/extension lint   # TypeScript check on extension
pnpm --filter @nowly/api typecheck    # tsc --noEmit on API
pnpm --filter @nowly/env typecheck    # Type checking on env pkg
```

### Presence Management (CLI)
```bash
pnpm presence              # Interactive CLI menu
pnpm presence:build        # Build all presences (src/ → dist/)
pnpm presence:clean        # Delete dist/presences
pnpm presence:rebuild      # Clean + build
```

### Admin/Publishing
```bash
pnpm internal-cli          # Interactive admin CLI menu
pnpm internal-cli push     # Publish presences to API (requires PRESENCE_SIGNING_PRIVATE_KEY)
pnpm internal-cli r2:sync  # Sync assets to Cloudflare R2 CDN
pnpm internal-cli host:publish # Publish native host binaries & installer to CDN
```

## Key Architectural Patterns

### Environment Configuration (@nowly/env)
- Four exports targeting different contexts: `server`, `client`, `extension`, `cli`
- Uses t3-oss/env-core + Zod for runtime validation
- Variables are context-aware (`NEXT_PUBLIC_*` for web, `VITE_*` for extension)
- Each context must be imported explicitly — no cross-context leakage

### Presence System (@nowly/presence, @nowly/websites)
- Presences are TypeScript files compiled to JS by the CLI (esbuild)
- Stored in `/packages/websites/src/` organized by initial letter (A/, D/, N/, T/, etc.)
- Built output goes to `dist/presences/{name}/` with `metadata.json` and `script.js`
- Each presence has `metadata.json` defining name, description, settings schema, icon/thumbnail URLs
- **PresenceConstructor** global available in scripts with `Settings()`, `Assets()`, `on('UpdateData')` API

### Extension Architecture (@nowly/extension)
- **Background script** (`src/background/index.ts`) — persistent service worker managing presence runtime
- **Popup/Sidepanel** (`src/app/`) — React UI for settings, native host status, presence list
- **Native messaging** (`src/background/native.ts`) — IPC bridge to the Go native host
- **Presence runtime** (`src/background/presence-runtime.ts`) — loads & executes presence scripts
- **Release security** (`src/background/release-security.ts`) — validates presence signatures before execution; unsigned presences fail in prod
- **Content script** (`src/content/index.ts`) — lightweight page context listener
- Built via Vite; `CDN_BASE_URL` falls back to `chrome.runtime.getURL()` when unset (see `build-dev.ts`)

### API Routes (@nowly/api/src/routes/)
- **auth.ts** — Discord OAuth flow, JWT token generation
- **presence.ts** — CRUD presence metadata
- **registry.ts** — public presence catalog with filtering/search
- **assets.ts** — CDN asset URL generation
- **stats.ts** — presence usage analytics
- All endpoints use Upstash Redis for caching; authenticated endpoints require `Authorization: Bearer <JWT>`

### Native Host (Go, apps/native/)
- Native messaging host ID: prod `kmnlnfldimgneaopdihplkebobckcjpf`, dev `abbegmindbabanjcabnmcjmamaoffbam`
- Messages: PING/PONG, SET_ACTIVITY/CLEAR_ACTIVITY, CONNECTED, OK/ERROR
- Releasing: tag `native-vX.Y.Z` triggers GitHub Actions to compile all platforms, build Windows installer, and publish to Cloudflare R2

## Presence SDK API (Global in Scripts)

```typescript
const presence = new Presence<typeof Settings>({...settings});

presence.on('UpdateData', (ctx) => {
  // Fires on every tick (page change, user setting update, etc.)
  // ctx.settings — user settings for this presence
});

presence.setActivity(data: PresenceData); // Send to Discord
presence.clearActivity();
presence.getSetting(key);                 // Fetch user's setting value
presence.getStrings(dict);               // Localized strings from web app
presence.info(msg) / presence.error(msg); // Log to extension console
```

Use `createMediaTimestamps()` to compute activity duration from `<audio>` / `<video>` elements.

## Presence Metadata Format

```json
{
  "author": "name",
  "name": {"en-US": "...", "fr-FR": "...", "es-ES": "..."},
  "description": {"en-US": "...", "fr-FR": "...", "es-ES": "..."},
  "category": ["streaming"],
  "icon": "https://cdn.nowly.me/...",
  "thumbnail": "https://cdn.nowly.me/...",
  "settings": {}
}
```

Settings use `PresenceSetting` types (boolean, input, select, slider) with multilingual labels. Schema validated against `packages/websites/metadata.schema.json`.

## Common Workflows

### Adding a New Presence
1. `pnpm presence init` — scaffolds new presence in `/packages/websites/src/X/presencename/`
2. Implement `Presence.on('UpdateData')` listener, call `setActivity()`
3. Define `Settings` via `Presence.Settings({...})` for user configuration
4. `pnpm presence:build` — CLI validates metadata, bundles script
5. `pnpm internal-cli push` — publish to API (requires signing key)

### Running Full Local Stack
```bash
pnpm dev:api          # Terminal 1
pnpm dev:web          # Terminal 2
pnpm presence:build   # Terminal 3 (optional, rebuild presences)
# Load extension in Chrome as unpacked extension from apps/extension/dist/
```

### Releasing a Native Host Update
1. Update Go code in `apps/native/`
2. `git tag native-v1.2.3 && git push origin native-v1.2.3`
3. GitHub Actions compiles, creates installer, publishes to R2, updates `latest.json`

## Tooling & Versions

- **pnpm v10.17.1** — `pnpm-lock.yaml` is authoritative; always use `workspace:*` for internal deps
- **Node 22** — required for all JS packages
- **Go 1.23** — for native host
- **TypeScript 5.7.3** — pinned across all packages
- **Vitest** — test runner for Node packages
- **tsx** — TS CLI runner (no build step needed for packages)
- **esbuild** — bundles presence scripts in the CLI

## CI/CD (GitHub Actions)

- **lint.yml** — ESLint/TypeScript check on push to `stable`
- **test-api.yml** — API vitest suite on push to `stable`
- **test-websites.yml** — Websites package tests on push to `stable`
- **host-release.yml** — Triggered by `native-vX.Y.Z` tag; builds Windows `.exe` + Linux `.tar.gz` on `windows-latest` and macOS `.dmg` on `macos-latest` in parallel, publishes all artifacts to CDN, creates GitHub release

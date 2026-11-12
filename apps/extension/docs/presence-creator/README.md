# Presence creator: server specification

This document specifies the server side of the presence creator: submission, storage, moderation, PR generation by the Nolo bot, automatic translation and publication. The extension side is done and already calls the routes described here. How the creator works is described in [`design.md`](./design.md).

## Contents

1. [What already exists](#1-current-state)
2. [Overview](#2-overview)
3. [Golden rule: the server regenerates everything](#3-golden-rule-the-server-regenerates-everything)
4. [Shared generator package](#4-shared-generator-package)
5. [Sign-in from the extension](#5-sign-in-from-the-extension)
6. [API contract](#6-api-contract)
7. [Server validation](#7-server-validation)
8. [Images](#8-images)
9. [Data model](#9-data-model)
10. [Statuses and moderation](#10-statuses-and-moderation)
11. [Automatic translation](#11-automatic-translation)
12. [Nolo bot: opening the PR](#12-nolo-bot-opening-the-pr)
13. [Publication and CI webhook](#13-publication-and-ci-webhook)
14. [Discord authors (and GitHub later)](#14-discord-authors-and-github-later)
15. [nowly.me pages](#15-nowlyme-pages)
16. [Security](#16-security)
17. [Delivery plan](#17-delivery-plan)
18. [Tests to write](#18-tests-to-write)
19. [Appendix: extension types](#19-appendix-extension-types)

## 1. Current state

### In the extension (`apps/extension`)

| Piece | File | Role |
|---|---|---|
| Declarative model | `src/shared/creator/creator-types.ts` | `CreatorDraft`, `CreatorPage`, `CreatorVariable`, etc. (copied in the [appendix](#19-appendix-extension-types)). |
| Generator | `src/shared/creator/creator-codegen.ts`, `creator-files.ts`, `creator-builtin-strings.ts` | Produces `presence.ts`, `metadata.json` and `locales/*.json` in the presences repository format. Checked against the real SDK, `scripts/validate-locales.ts` and `metadata.schema.json`. |
| Validation | `src/shared/creator/creator-validation.ts` | Every rule, per step. Reuse it as is on the server. |
| Migration | `normalizeDraft` in `creator-draft.ts` | Upgrades older drafts. |
| Export | `src/shared/creator/creator-export.ts` | `creatorDefinition(draft)`, `buildTextFiles(draft)`, zip. |
| API client | `src/background/services/creator-api.ts` | Calls `POST /me/presence-submissions` and `GET /me/presence-submissions` with the account token. |
| Contract | `src/shared/creator/creator-submission.ts` | `CreatorAccount`, `CreatorSubmissionPayload`, statuses, `parseSubmission`. |
| Sign-in | `START_ACCOUNT_CONNECT` with `permission: "creator"` (`background/services/account-sync.ts`) | Opens `account.nowly.me/connect?permission=creator`, the same flow as public activities. |
| Preview | `src/preview/mock-creator.ts` | Simulates the server (permission, submission, status progress) to test the UI without a back end. |

Until the routes exist, the extension gets a 404 when sending, shows "Sending isn't available yet" and offers the zip export. Nothing breaks if the back end arrives later.

### In the monorepo

- Hono API organised by feature (`apps/api/src/features/<name>/<name>.routes.ts` + `.service.ts`, an `AGENTS.md` per folder). Drizzle schema in `packages/database/src/schema/<domain>/<table>.ts`, Better Auth configuration in `packages/auth`.
- Better Auth (`features/auth/better-auth.ts`, base `/auth`): **Discord only**, `User.role` and `User.discordId` (filled from the Discord profile, not settable by the client), cookies shared on `.nowly.me`.
- Extension accounts (`features/account`): `nxt_` tokens (32 random bytes, only the SHA-256 is stored in `ExtensionToken.tokenHash`), 90-day sliding expiry, scopes `sync`, `assets` and `creator` (`EXTENSION_TOKEN_SCOPES` in `@nowly/shared`). Guard `requireExtensionToken(scope)`, user read with `accountOf(c).userId`. The `account.nowly.me/connect?permission=creator` page grants `creator` explicitly, never automatically.
- Direct precedent: public activities (`features/activity-sharing`, `ActivityPublication` model) already require `requireExtensionToken("creator")` and a `discordId`, under `/me/activity-publications`. The creator follows exactly this model.
- Any new per-user data must be added to `exportAccountData` and `deleteAccountData` (`account.service.ts`).
- R2 is already used by the API (`@aws-sdk/client-s3`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` in `@nowly/env/server`, see `features/custom-assets`).
- CORS accepts the `chrome-extension://` and `moz-extension://` origins (`apps/api/src/middleware/cors.ts`). Global limit: `rateLimit` (`apps/api/src/middleware/rate-limit.ts`), 100 requests per minute.
- Request bodies are limited to **1 MiB by default** by `apps/api/src/middleware/body-limit.ts`: too small for a submission (see section 6), whose route sets its own larger `limitBody`.
- The API has no automatic translation client today: to add (section 11).
- Admin guards: `requireAuth` (`features/auth/auth.middleware.ts`) compares a shared secret, with no notion of account. There is no session-based "moderator" guard yet.
- The `Presence` model stores `metadata` as JSON; the author lives on `PresenceVersion` (`author`, `authorGithub`).
- The website author page is `apps/web/app/[locale]/author/[github]` and only knows GitHub.

## 2. Overview

```
Extension                    nowly.me                     API                         GitHub
─────────                    ────────                     ───                         ──────
Allow ────────────────────▶ /connect (account) ──────▶ Better Auth (Discord)
                             ?permission=creator           nxt_ token with creator scope
account ◀── postMessage ─── NOWLY_SESSION (existing)

Send ────────────────────────────────────────────────▶ POST /me/presence-submissions
                                                         validates, regenerates, stores
                                                         status "submitted"
                             /requests (public, votes) ◀─ GET /presence-submissions
                             moderator view ───────────▶ approve / request-changes / reject
                                                         job: translates, regenerates,
                                                         Nolo opens the PR ─────────▶ PR "creator/<slug>-<id>"
                                                         status "in_progress"          existing CI
                                                                                       merge
                                                         POST /presence-submissions/published ◀── presence-update.yml
                                                         status "published"
Refresh ─────────────────────────────────────────────▶ GET /me/presence-submissions
```

## 3. Golden rule: the server regenerates everything

The extension sends the **definition** (declarative data) and, for information, the files it generated. The server:

- ignores the `files` field for anything that gets published (it may compare it with its own output to detect an outdated extension, nothing more);
- recomputes `metadata.json`, `presence.ts` and `locales/*.json` from the definition with the same generator;
- never accepts code written by the user. The generated code only reads the DOM and makes no network request.

This is what lets us accept presences from people who cannot code without reviewing TypeScript every time.

## 4. Shared generator package

Move the pure part of `src/shared/creator/` into a monorepo package, for example `packages/presence-creator` (`@nowly/presence-creator`), used by the extension and the API.

To move (no dependency on `chrome.*` or React):

- `creator-types.ts`, `creator-draft.ts`, `creator-activity.ts`, `creator-validation.ts`
- `creator-files.ts`, `creator-codegen.ts`, `creator-builtin-strings.ts`
- `creator-export.ts` (only `buildCreatorZip` depends on `fflate`; keep it in the extension to avoid the dependency in the API)
- `creator-submission.ts` (contract types, `parseSubmission`, statuses)
- `creator.test.ts` and `creator-fixtures.ts`

Stay in the extension: `creator-dom.ts`, `creator-selector.ts`, `creator-storage.ts` (DOM and `chrome.storage`).

Dependencies to resolve when moving: `LongLocale` and `PRESENCE_LOCALES` (`src/shared/locales.ts`), `PresenceMetadata["category"]`, `PresenceData` and `AccountUser` (`src/shared/types`). Take them from `@nowly/shared` or `@nowly/sdk`.

The package exposes at least: `normalizeDraft`, `validateDraft`, `buildTextFiles`, `buildMetadata`, `generatePresenceSource`, `presenceSlug`, `presenceFolder`, and the types.

## 5. Sign-in from the extension

Nothing to build: the creator reuses the extension's Nowly account.

- The extension calls `START_ACCOUNT_CONNECT` with `permission: "creator"` (through `AccountConnectButton`), which opens `account.nowly.me/connect?source=extension&device=<id>&permission=creator`. The page asks for `sync` and `creator`, explains public attribution and never connects without a click (`apps/account/features/account/AGENTS.md`). The token comes back through the existing `NOWLY_SESSION` message.
- An account already connected with `sync` only sees "Allow publishing" and goes through the same page again.
- The background checks `scopes.includes("creator")` and `user.discordId` before any submission, like public activities.
- Creator routes are protected by `requireExtensionToken("creator")` and read the author with `accountOf(c).userId`, never from the body.
- 401 or 403: the extension assumes the permission is missing and offers "Allow publishing" again. It does not sign the account out (sync handles its own 401).

### GitHub later

Better Auth only offers Discord. To credit a GitHub login (`author.github`, `Co-authored-by` in the PR), we will need to:

- add the GitHub provider to `socialProviders`, with an additional `githubLogin` field on `User` (the login, not the numeric id from `Account.accountId`), not settable by the client;
- expose it in `GET /me` and in the user returned to the extension (`AccountUser`), then extend `authorFromAccount` (`creator-submission.ts`);
- add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` to `@nowly/env/server`.

The `CreatorAuthor.github` type is already there; the UI only shows Discord today.

## 6. API contract

Every JSON date is an ISO 8601 string, except the token's `expiresAt` (milliseconds).

### For the extension (already called)

#### `POST /me/presence-submissions`

- Access: `requireExtensionToken("creator")` and a non-null `User.discordId` (403 otherwise).
- **Route `bodyLimit`: 8 MB** (the three images arrive as base64 data URLs).
- Dedicated rate limit: for example 5 submissions per hour and per account.

Body (`CreatorSubmissionPayload`):

```json
{
  "definition": { "id": "a1b2c3d4", "name": "Example Tube", "domains": ["example.com"], "pages": [], "…": "see the appendix" },
  "translate": true,
  "files": [{ "path": "src/E/Example Tube/metadata.json", "content": "…" }],
  "assets": {
    "logo": "data:image/png;base64,…",
    "icon": "data:image/png;base64,…",
    "thumbnail": "data:image/jpeg;base64,…",
    "thumbnailRightsConfirmed": true
  }
}
```

Processing:

1. `normalizeDraft(definition)`, then overwrite `definition.author` with the account's author (section 14). Never trust the author that was sent.
2. `validateDraft(definition, existingSlugs)` and the extra server rules (section 7). Any issue: 422.
3. Check and store the images (section 8).
4. Regenerate the files (section 3) and store them with the submission (useful for the moderator preview).
5. If `definition.id` matches a submission by the same author in `changes_requested` or `rejected`, **update** that submission (new revision) and set it back to `submitted`. The extension sends the same `definition.id` on "Send again". Otherwise, create a new submission.

Responses:

| Code | Body | Effect in the extension |
|---|---|---|
| 201 | `{ "id": "…", "status": "submitted", "updatedAt": "…" }` (+ optional `prUrl`, `note`) | Stores the submission in the draft, shows the timeline. |
| 401 / 403 | `{ "error": "UNAUTHORIZED" }` or `{ "error": "CREATOR_REQUIRED" }` | Offers "Allow publishing" again. |
| 404 | (missing route) | "Sending isn't available yet". |
| 409 | `{ "message": "…" }` | A submission for this id is already under review (not handled yet: the extension shows it as unavailable; plan to treat it like 422). |
| 422 | `{ "message": "Readable text" }` | Shows `message` as is. Write it in plain English or localise it from `Accept-Language`. |
| 5xx | any | "Sending isn't available yet". |

#### `GET /me/presence-submissions?ids=a,b,c`

- Access: `requireExtensionToken("creator")`. Return only this account's submissions, filtered by the requested ids (the ids returned on submission).
- 200 response: `[{ "id": "…", "status": "in_progress", "updatedAt": "…", "prUrl": "https://github.com/…", "note": "…" }]`.
- `note`: the moderator's message (shown as is, plain text).

### For the website (to build)

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/presence-submissions?status=submitted&cursor=` | Public | Paginated list for the requests page: name, domains, category, author, images (R2 URLs), description in the requested language, vote count, date. |
| GET | `/presence-submissions/:id` | Public | Detail: public definition, images, regenerated files, status history. |
| POST / DELETE | `/presence-submissions/:id/vote` | Session cookie | Vote or remove a vote. |
| GET / POST | `/presence-requests` | Public / session | List or create a site request (unique domain). |
| POST / DELETE | `/presence-requests/:id/vote` | Session cookie | Vote for a request. |

### Moderation

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/presence-submissions/queue` | Moderator | Queue sorted by votes then age. |
| POST | `/presence-submissions/:id/approve` | Moderator | Sets `approved` and starts the PR job (section 12). |
| POST | `/presence-submissions/:id/request-changes` | Moderator | Body `{ "note": "…" }` (required). |
| POST | `/presence-submissions/:id/reject` | Moderator | Body `{ "note": "…" }` (required). |

Moderator access: `User.role` is `moderator` or `admin`, checked on the Better Auth session (`requireSession` then a role read). This is a new guard: the current `requireAuth` only knows a shared secret. It must follow the fail-closed rule of `features/auth/AGENTS.md`.

### CI

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/presence-submissions/published` | Shared secret (`CREATOR_WEBHOOK_SECRET`) | Body `{ "slug": "example-tube", "commit": "<sha>", "pr": 123 }`. Sets the linked submission to `published`. |

## 7. Server validation

Call `validateDraft` from the shared package (the same rules as the UI), then add the checks that only make sense on the server. The server must never rely on the UI's `maxLength`.

### Rules taken from the extension

| Data | Rule |
|---|---|
| Name | 1 to 40 characters, `^[\p{L}\p{N}][\p{L}\p{N} .+!&'-]{0,39}$`, slug (`lower-case name, spaces as hyphens`) free in the catalogue **and** among pending submissions. |
| Domains | At least one, `^([a-z0-9-]+\.)+[a-z]{2,}$` after normalisation (no protocol, path, port or `www.`). |
| Colour | `^#[0-9a-fA-F]{6}$`. |
| Category | A value of the `metadata.schema.json` enum. |
| Languages | `translationMode` `auto` or `manual`. In `manual`, `en-US` is required. Languages limited to those of the presences repository. |
| Short description | Required in every written language, 120 characters max. |
| Long description | Optional, 600 characters max. |
| Features | 1 to 5, 80 characters max each, at least one per written language. |
| Pages | At least one. An "every address" page (`any` mode or empty path) must be last. |
| Page texts | First line required in every language, 128 characters max; second line 128 max; button label required when the button is on, 32 max. |
| Variables | Every `{name}` used in a text or an address must exist in the page variables. |
| Custom addresses | Image and button link: start with `https://`, 256 characters max. A `variable` reference must point to an existing variable. |

### Extra server rules

- Global sizes: 20 pages max, 12 variables per page max, page name 40 characters, variable name `^[a-z][a-zA-Z0-9]{0,31}$`.
- CSS selectors (`source.selector`): 300 characters max, must parse in Node (check with a parser such as `css-what`), no needless `\` or control characters.
- Texts: reject control characters, normalise spaces. No HTML (everything is shown as plain text, but the website must escape it anyway).
- `definition.id`: 8 alphanumeric characters.
- Unknown fields are ignored (rebuild the definition field by field instead of storing the received object).
- `assets.thumbnailRightsConfirmed` must be `true`.

## 8. Images

Specifications (identical to the presences repository CI):

| File | Exact size | Format | Constraint |
|---|---|---|---|
| `assets/thumbnail.jpg` | 1920 × 1080 | JPEG | Rights confirmed by the author. |
| `assets/logo.png` | 300 × 300 | PNG | With a background. |
| `assets/icon.png` | 128 × 128 | PNG | Transparent background (transparent edges). |

The extension already crops and resizes to the exact sizes, but the server must check everything again:

1. Decode the data URL, check the real type from the magic bytes (not from the `data:` prefix).
2. Open it with `sharp`: exact dimensions, expected format. Max decoded size: 4 MB per image.
3. Icon: check the edge transparency with the same rule as `creator-image.ts` (at least one border pixel with alpha below 250).
4. Re-encode (strips EXIF metadata and any hidden content).
5. Store on R2 under `creator/<submissionId>/<revision>/{thumbnail.jpg,logo.png,icon.png}` and keep the keys in the database (`presence_submission_revisions.assets`). Images never go in the database.

Built in `apps/api/src/features/presence-submissions/submission-images.ts` and `submission-storage.ts` (rules in that folder's `AGENTS.md`). Errors: `422 INVALID_IMAGE`, `503 STORAGE_UNAVAILABLE` when R2 is not configured.

## 9. Data model

Shape of the new tables. They are written as Drizzle tables in `packages/database/src/schema/creator/` (one file per table, see `packages/database/AGENTS.md`); the Prisma notation below is kept as a compact reference:

```prisma
model PresenceSubmission {
  id            String    @id @default(cuid())
  draftId       String    @map("draft_id")
  authorId      String    @map("author_id")
  author        User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorName    String    @map("author_name")
  authorGithub  String?   @map("author_github")
  authorDiscord String?   @map("author_discord")
  requestId     String?   @map("request_id")
  slug          String
  status        String
  translate     Boolean
  definition    Json
  files         Json
  assetKeys     Json      @map("asset_keys")
  revision      Int       @default(1)
  note          String?
  moderatorId   String?   @map("moderator_id")
  prNumber      Int?      @map("pr_number")
  prUrl         String?   @map("pr_url")
  publishedAt   DateTime? @map("published_at") @db.Timestamptz(6)
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  votes  PresenceSubmissionVote[]
  events PresenceSubmissionEvent[]

  @@unique([authorId, draftId])
  @@index([status])
  @@index([slug])
  @@map("presence_submissions")
}

model PresenceSubmissionEvent {
  id           String   @id @default(cuid())
  submissionId String   @map("submission_id")
  status       String
  actorId      String?  @map("actor_id")
  note         String?
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  submission PresenceSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)

  @@index([submissionId])
  @@map("presence_submission_events")
}

model PresenceSubmissionVote {
  submissionId String   @map("submission_id")
  userId       String   @map("user_id")
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  submission PresenceSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)

  @@id([submissionId, userId])
  @@map("presence_submission_votes")
}

model PresenceRequest {
  id        String   @id @default(cuid())
  domain    String   @unique
  name      String
  status    String   @default("open")
  createdBy String   @map("created_by")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  votes PresenceRequestVote[]

  @@map("presence_requests")
}

model PresenceRequestVote {
  requestId String   @map("request_id")
  userId    String   @map("user_id")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  request PresenceRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)

  @@id([requestId, userId])
  @@map("presence_request_votes")
}
```

To add to existing models:

- `User`: a `presenceSubmissions PresenceSubmission[]` relation (and `githubLogin` once GitHub arrives, section 5).
- `PresenceVersion`: `authorDiscord String? @map("author_discord")` next to `authorGithub` (section 14).

Submissions and votes go into `exportAccountData` and `deleteAccountData`. The API returns the `PresenceSubmission` `id` to the extension; `draftId` is the draft id (`definition.id`), used to recognise a resubmission.

## 10. Statuses and moderation

Statuses known to the extension (`SubmissionStatus`): `submitted`, `changes_requested`, `approved`, `in_progress`, `published`, `rejected`. Returning any other value breaks the display (the response is ignored).

| From | To | Trigger |
|---|---|---|
| (none) | `submitted` | Submission. |
| `submitted` | `approved` | Moderator. Starts the PR job. |
| `submitted` | `changes_requested` | Moderator, with `note`. |
| `submitted` | `rejected` | Moderator, with `note`. |
| `changes_requested` or `rejected` | `submitted` | Resubmitted by the author (same `draftId`), `revision + 1`. |
| `approved` | `in_progress` | PR opened by Nolo, `prNumber` and `prUrl` set. |
| `in_progress` | `published` | CI webhook on merge. |
| `in_progress` | `changes_requested` | PR closed without merge or unfixable red CI: moderator, with `note`. |

The extension only allows editing and resending in `changes_requested` and `rejected` (`canEditSubmission`). Write each transition to `PresenceSubmissionEvent`.

Votes sort the queue; they never approve on their own.

## 11. Automatic translation

When `translate` is `true` (`translationMode` `auto`), the author only wrote in `definition.baseLocale`. On approval, before regenerating:

- translate into every language of the presences repository: `description`, `longDescription`, each `features` entry, and for each page `details`, `state`, `button.label`;
- **keep the `{name}` tokens intact** (mask them before the call, restore them after, and check that each translation holds exactly the same tokens; otherwise keep the base text for that language);
- respect the length limits (120, 600, 80, 128, 32): translate again shorter or truncate cleanly;
- set `translationMode` to `manual` and `locales` to the full list in the definition used for the PR;
- add a translation client (the API has none today) with a structured output validated by zod.

Built-in texts ("Browsing", the "Show buttons" settings) are already translated in `creator-builtin-strings.ts`.

Built with Cloudflare Workers AI (small model, JSON mode) in `apps/api/src/features/presence-submissions/submission-translation.ts`. It runs in the Nolo job before the files are generated and targets `en-US`, `fr-FR` and `es-ES` (rules in that folder's `AGENTS.md`).

## 12. Nolo bot: opening the PR

An asynchronous job started on approval (a simple database queue or a background task; it must be safely retryable without duplicates):

1. Load the submission, translate when needed (section 11), `normalizeDraft`, `validateDraft` one last time.
2. Generate `metadata.json`, `presence.ts`, `locales/*.json` with `buildTextFiles`.
3. Fetch the images from R2.
4. Through a **"Nolo" GitHub App** installed on `nowly-presence/presences` (permissions: contents write, pull requests write):
   - branch `creator/<slug>-<short submissionId>` from `stable`;
   - one commit adding `src/<Letter>/<Name>/` (text files and `assets/`);
   - PR to `stable`, labels `presence` and `creator`, body: link to `nowly.me/requests/<id>`, author, domains, a summary of the pages;
   - credit: `Co-authored-by: <login> <id+login@users.noreply.github.com>` when the author is on GitHub; otherwise their name and Discord account in the body.
5. Store `prNumber`, `prUrl`, status `in_progress`.

If the folder already exists in the repository (name collision), never overwrite: set `changes_requested` with a note.

Environment variables in `packages/env` (server context): `NOLO_APP_ID`, `NOLO_PRIVATE_KEY`, `NOLO_INSTALLATION_ID`, `NOLO_REPOSITORY`, `NOLO_BASE_BRANCH`, `CREATOR_WEBHOOK_SECRET` (the R2 credentials already exist).

Built in `apps/api/src/features/presence-submissions/submission-pull-request.ts`. In this version the job starts on admin publish (status `in_progress`), not on approval, and the PR is tracked by `pr_revision` so a new revision updates the same branch and pull request (rules in that folder's `AGENTS.md`).

## 13. Publication and CI webhook

On merge, the presences repository CI publishes the presence with the internal CLI (`npx tsx index.ts push …` from its `packages/internal-cli` checkout). Add a final step per published slug:

```bash
curl -fsS -X POST "$API_URL/presence-submissions/published" \
  -H "Authorization: Bearer $CREATOR_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d "{\"slug\":\"$SLUG\",\"commit\":\"$GITHUB_SHA\",\"pr\":$PR_NUMBER}"
```

The route finds the `in_progress` submission by `slug` (or `prNumber`), sets `published`, fills `publishedAt`, and sets the `PresenceRequest` rows for the same domain to `available` (voters can be notified later). It must be idempotent and do nothing for a slug that does not come from the creator.

## 14. Discord authors (and GitHub later)

Signing in is required and the account is the author. There is no author field in the UI.

- Today: `author: { name: User.name, discord: User.discordId }`.
- With GitHub (section 5): `author: { name, github: githubLogin }`, which wins over `discord`.

No `authorType` column: the type follows from the field present. Display rule on the website and in the extension:

1. `github` present: link `github.com/<github>`, avatar `github.com/<github>.png`.
2. Otherwise `discord` present: link `discord.com/users/<id>` (opens the profile in Discord), avatar `User.image` or resolved by the API.
3. Otherwise: no link.

Changes:

- `metadata.schema.json` in the presences repository and the `Metadata` type of `@nowly/sdk`: add `discord` (optional string) to `author` and to every `contributors` entry.
- `PresenceVersion.authorDiscord String? @map("author_discord")`, filled by `internal-cli push` from `metadata.json`, like `authorGithub`.
- `apps/web`: the author page is `/author/[github]` today. Add a route for Discord authors (for example `/author/discord/[id]`) or an author page keyed by internal id.

## 15. nowly.me pages

| Route | Content |
|---|---|
| `/requests` | Public library: "Requests" (wanted sites) and "Proposed presences" (`submitted` submissions) tabs, sorted by votes, a vote button (sign-in required). |
| `/requests/<id>` | Submission detail: images, texts, pages, author, status, votes, PR link. |
| `/moderation` | Moderator queue (role required): preview, highlighted regenerated files, approve, request changes and reject actions. |

Reuse `@nowly/ui` and the project rule on button-styled links (root `AGENTS.md`).

## 16. Security

- Systematic server-side regeneration (section 3), the definition rebuilt field by field.
- A high `bodyLimit` **only** on `POST /me/presence-submissions`.
- Per-account rate limits: submissions, votes, request creation. A minimum account age is possible against spam.
- Images re-encoded, checked by content, stored outside the database.
- Custom addresses limited to `https://`; the generated presence inserts values read on the page without making any request.
- Account tokens are already stored hashed and revocable; the `creator` scope stays explicit and `sync` alone is refused.
- Displayed texts escaped everywhere on the website (descriptions, moderation notes, names).
- Moderators check banner rights, trademarks and content.

## 17. Delivery plan

Each step is usable on its own; the extension works at every one of them.

1. **Shared package** (section 4) and the extension moved onto it. No visible change.
2. **Submission**: `POST /me/presence-submissions`, `GET /me/presence-submissions`, `requireExtensionToken("creator")`, R2, validation, `PresenceSubmission` model. At this point the extension shows "Waiting for review".
3. **Minimal moderation**: moderator routes and the `/moderation` page. Manual approval, PR opened by hand from the export if the bot is not ready.
4. **Nolo**: GitHub App and PR job, status `in_progress`.
5. **Publication**: webhook in `presence-update.yml`, status `published`.
6. **Automatic translation**.
7. **Public library and votes** (`/requests`, `PresenceRequest`).
8. **Authors**: `discord` in the schema and the SDK, Discord author page, then the GitHub provider.

## 18. Tests to write

API side (Vitest, `apps/api`):

- Validation: reuse `creator-fixtures.ts` (a complete valid draft) and check every rule of sections 7 and 8 (edge cases just under and just over each length).
- `POST /me/presence-submissions`: 201, 401 without a token or with an expired or revoked token, 403 with a `sync`-only token or without `discordId`, 422 with `message`, resubmitting the same `draftId` after `changes_requested` (revision + 1), a different author in the body is overwritten, not refused.
- `GET /me/presence-submissions`: never returns another account's submissions.
- Forbidden status transitions (for example `published` to `submitted`).
- Images: wrong size, disguised format (PNG sent as JPEG), opaque icon, image too heavy.
- Translation: `{name}` tokens kept, limits respected.
- Webhook: secret required, idempotence.
- Generator: the package output must stay identical to the extension's for `creator-fixtures.ts` (snapshot test); the generated `presence.ts` must compile with `tsc` in the presences repository (in that repository's CI, on the Nolo PR).

Extension side: the preview (`pnpm --filter @nowly/extension preview`) already simulates the whole flow; point it at a local API by changing the API URL in the developer settings.

## 19. Appendix: extension types

Taken from `apps/extension/src/shared/creator/creator-types.ts` and `creator-submission.ts` at the time of writing. When in doubt, the extension code is the reference.

```ts
type LocalizedText = Partial<Record<LongLocale, string>>

type CreatorSource =
  | { kind: "element"; selector: string; read: "text" | "image" | "link" }
  | { kind: "tabTitle" }
  | { kind: "meta"; property: "og:title" | "og:description" | "og:image" }

type CreatorVariable = { id: string; name: string; source: CreatorSource; sample?: string }

type CreatorImage = { kind: "logo" } | { kind: "variable"; variableId: string } | { kind: "custom"; template: string }

type CreatorLink = { kind: "page" } | { kind: "variable"; variableId: string } | { kind: "custom"; template: string }

type CreatorPage = {
  id: string
  name: string
  match: { mode: "any" | "equals" | "startsWith" | "contains"; path: string }
  activityType: "watching" | "listening" | "playing" | "competing"
  variables: CreatorVariable[]
  details: LocalizedText
  state: LocalizedText
  largeImage: CreatorImage
  timestamps: "media" | "elapsed"
  button: { enabled: boolean; label: LocalizedText; link: CreatorLink }
}

type CreatorAuthor = { name: string; github?: string; discord?: string }

type CreatorDefinition = {
  id: string
  createdAt: number
  updatedAt: number
  step: "visuals" | "identity" | "language" | "texts" | "pages" | "review"
  name: string
  domains: string[]
  color: string
  category: "streaming" | "music" | "video" | "social" | "gaming" | "tools" | "ai" | "learning" | "creator" | "other"
  baseLocale: LongLocale
  translationMode: "manual" | "auto"
  locales: LongLocale[]
  description: LocalizedText
  longDescription: LocalizedText
  features: LocalizedText[]
  pages: CreatorPage[]
  browsingFallback: boolean
  author: CreatorAuthor
}

type CreatorSubmissionPayload = {
  definition: CreatorDefinition
  translate: boolean
  files: { path: string; content: string }[]
  assets: { logo: string; icon: string; thumbnail: string; thumbnailRightsConfirmed: boolean }
}

type SubmissionStatus = "submitted" | "changes_requested" | "approved" | "in_progress" | "published" | "rejected"

type CreatorSubmissionResponse = { id: string; status: SubmissionStatus; updatedAt: string; prUrl?: string; note?: string }

type CreatorAccount = {
  user: { id: string; name: string; image: string | null; discordId: string | null }
  creator: boolean
}
```

Meaning of the fields the generator uses:

- `match`: the page applies when the URL path matches (`startsWith`, `equals` ignoring the trailing slash, `contains`, or always for `any`). The first matching page wins.
- `variables`: read on the page. `element` reads the text, the image (`src`, `https://` only) or the link (`href`) of the first element matching the selector.
- `details` and `state`: templates with `{name}`. When a first-line variable is empty, the activity is cleared for that page.
- `largeImage` and `button.link`: `custom` is an address template; the image or button is omitted while a variable it uses is empty.
- `timestamps`: `elapsed` counts from arrival on the page; `media` uses the audio or video player, otherwise the time on the page.
- `browsingFallback`: on the site's other pages, shows "Browsing" (a setting the user can turn off).
- `step`, `createdAt`, `updatedAt`, `sample`: editor-only, ignored by the server.

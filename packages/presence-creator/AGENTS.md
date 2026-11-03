# @nowly/presence-creator

Pure model, validation and code generator of the presence creator, shared by the extension and (later) the API, which regenerates every file from the declarative definition and never trusts the files sent by the client.

## Rules

- No `chrome.*`, DOM access, React or `fflate`. Zip building, DOM reading, selectors and `chrome.storage` stay in `apps/extension/src/shared/creator`.
- Only depends on `@nowly/locales` (types). Types that used to come from the extension (`CreatorCategory`, `CreatorPreviewActivity`, `CreatorAccountUser`) are defined here.
- Consumers import a module by subpath (`@nowly/presence-creator/creator-draft`) or from the barrel.
- The generated output must stay identical for `creator-fixtures.ts`: `creator.test.ts` checks it.

## Checks

`pnpm --filter @nowly/presence-creator typecheck` and `test`, then `pnpm --filter @nowly/extension lint` and `test`.
- `creator-schema.ts` (`parseCreatorDefinition`) is the strict server-side schema of a definition and `creator-diff.ts` (`diffDefinitions`) the field-by-field diff used for revision history. Change them together with the API (`apps/api/src/features/presence-submissions`).

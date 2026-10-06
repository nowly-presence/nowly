# Contributing to Nowly

Thanks for helping improve Nowly.

Nowly is a monorepo for the website, API, browser extension, native host, and release tooling. The SDK, CLI, presences, and internal CLI are maintained in separate repositories or submodules.

## Before You Start

- Check existing issues and pull requests before starting a larger change.
- For a security vulnerability, do not open a public issue. Follow [SECURITY.md](./SECURITY.md).
- Open issues and pull requests in the repository that owns the component you are changing.

## Development Setup

Clone the repository with its submodules, then install dependencies:

```bash
git clone --recurse-submodules https://github.com/nowly-presence/nowly.git
cd nowly
pnpm install
```

If the repository was cloned without submodules:

```bash
git submodule update --init --recursive
pnpm install
```

The package manager version is pinned in the root `package.json`. Use that version rather than assuming a global pnpm version.

## Repository Areas

- `apps/web` — public website and user dashboard.
- `apps/docs` — public documentation site.
- `apps/insights` — internal analytics dashboard.
- `apps/extension` — browser extension.
- `apps/api` — Fastify API.
- `apps/native` — Go native messaging host.
- `packages/env`, `packages/shared`, `packages/analytics`, `packages/ui`, `packages/locales` — shared workspace packages.
- `packages/presences` — presence definitions, maintained as a separate repository.
- `packages/sdk` — presence SDK, maintained as a separate repository.
- `packages/cli` — presence CLI, maintained as a separate repository.
- `packages/internal-cli` — publishing and release tooling, maintained as a separate repository.

Changes inside a submodule belong to that submodule's repository. Check `git status` inside the submodule and open its pull request there; the main repository only records the submodule revision.

## Common Commands

Run commands from the repository root unless noted otherwise:

```bash
pnpm dev:api
pnpm dev:web
pnpm dev:docs
pnpm dev:insights
pnpm --filter @nowly/extension dev
```

Targeted checks:

```bash
pnpm --filter @nowly/api test
pnpm --filter @nowly/api typecheck
pnpm --filter @nowly/env test
pnpm --filter @nowly/analytics test
pnpm --filter @nowly/extension test
pnpm --filter @nowly/web lint
pnpm --filter @nowly/docs lint
pnpm --filter @nowly/extension lint
```

Use the narrowest relevant command while developing. A pull request should include the checks that cover the changed component.

## Adding or Updating a Presence

Presence definitions live in the `packages/presences` submodule:

1. Create or update the presence under `packages/presences/src/<LETTER>/<name>/`.
2. Keep metadata, locales, assets, and the presence script consistent.
3. Validate the metadata and bundle with the presence CLI.
4. Test the supported pages and the resulting Discord activity.
5. Open the pull request in the `nowly-presence/presences` repository.

Do not commit generated presence bundles or publishing output to the main repository unless the owning workflow requires it.

## Pull Requests

Keep each pull request focused on one related change. Include:

- What changed and why.
- Which application, package, or submodule is affected.
- How the change was tested.
- Screenshots or recordings for visible UI changes when useful.
- Migration, configuration, or deployment notes when relevant.

Use the repository pull request template and select the affected component(s). Update documentation and tests when the observable behavior or public contract changes.

## Commit Messages

Use the Conventional Commits format used by this repository:

```text
<type>(<scope>): <imperative summary>
```

Examples:

```text
feat(api): add device pairing endpoint
fix(docs): resolve changelog source links
docs(cli): document browser-specific extension loading
chore(cli): update stable submodule revision
```

Use a meaningful scope such as `api`, `web`, `docs`, `extension`, `native`, `cli`, `presences`, or `themes`. Keep the subject concise and explain implementation details in the commit body when needed.

## Code and Review Expectations

- Follow the existing patterns in the affected package.
- Do not mix unrelated formatting or dependency updates into a change.
- Avoid logging secrets, tokens, personal data, or full request payloads.
- Preserve the repository's privacy model: presence activity is intended to stay local unless a feature explicitly documents a server-side data flow.
- Add a regression test when a plausible bug would otherwise return unnoticed.

Reviewers may request narrower scope, additional verification, or documentation updates before merging.

# Presence submissions

Creator submissions, their revisions, reviews and history. Contract with the extension: `apps/extension/docs/presence-creator/README.md` (sections 6 and 10).

## Model

- `creator_presences`: the published declarative definition of a creator presence (`revision` increments on each publication). Only these presences can be edited in the creator; a catalog presence without one answers `409 NOT_CREATOR_PRESENCE`.
- `presence_submissions`: one per author and draft id (`definition.id`), `kind` is `create` or `update` (with `baseRevision`, the creator presence revision it started from).
- `presence_submission_revisions`: every send or resend is a new numbered revision with the definition, the server-generated files and `changes` (`diffDefinitions` from `@nowly/presence-creator`, field by field and per page name).
- `presence_submission_reviews`: `approve`, `comment`, `request_changes` or `reject`, tied to the revision reviewed, with an optional message and field comments (`{ field, page?, message }`).
- `presence_submission_events`: the history shown to authors and reviewers (`submitted`, `resubmitted`, `review.<verdict>`, `publish` with `withoutReview`, `published`, `pr.closed`).

## Rules

- The server rebuilds everything: `parseCreatorDefinition` (strict schema, unknown fields dropped), author overwritten from the account, files regenerated with `buildTextFiles`. Never store or publish what the client sent as files.
- Images (`submission-images.ts`) are data URLs in `assets`, with `thumbnailRightsConfirmed: true`. The server checks the real bytes (magic number and `sharp` metadata, never the declared type), the exact size (thumbnail 1920x1080 JPEG, logo 300x300 PNG, icon 128x128 PNG with at least one transparent edge pixel) and 4 MiB per image, then re-encodes them, which drops metadata. Failures answer `422 INVALID_IMAGE`; a missing R2 configuration answers `503 STORAGE_UNAVAILABLE` before anything is written.
- Images are stored on R2 at `creator/<submission id>/<revision>/<attempt id>/<file>` (`submission-storage.ts`, immutable cache) before the transaction, and the full keys go in `presence_submission_revisions.assets`. Each upload attempt owns its keys so a failed upload or transaction can clean up without affecting a competing attempt. The detail view exposes them as public URLs. Account deletion erases the files of every authored revision before the rows cascade.
- Statuses follow `@nowly/presence-creator/creator-submission-policy`. Authors can resend only in `changes_requested` or `rejected`. Every review or publish names the revision it acts on (`409 STALE_REVISION` otherwise) and runs in a transaction that locks the submission row.
- Submission writes lock the target slug for the transaction and recheck pending submissions there. A row lock alone cannot prevent two drafts from opening submissions for the same slug when neither row exists yet.
- Moderators (`review`) approve, comment, request changes or reject; nobody reviews their own submission. Only admins (`publish`) publish: from `approved`, or directly from `submitted`, which the history records as `withoutReview`. Publishing moves the submission to `in_progress` and starts the PR job.
- `POST /presence-submissions/pull-request-closed` (`{ slug, pr }`, same secret) is called by the presences repository when a creator pull request is closed without merging: the `in_progress` submission with that `pr_number` goes back to `changes_requested` with a note and a `pr.closed` event, so the author can resend.
- Deleting a presence (`DELETE /admin/presences/:slug`) also removes its folder from the presences repository with one commit on the base branch (`removePresenceFolder`, best effort: the answer carries `repository`: `removed`, `missing`, `failed` or `disabled`). The publish workflow only runs on merged pull requests, so that commit republishes nothing.
- `POST /presence-submissions/published` is the CI webhook (`CREATOR_WEBHOOK_SECRET`): it sets `published` and writes the definition to `creator_presences`.
- A submission is visible only to its author and to reviewers (`404` for anyone else, never `403`, so ids do not leak).
- Every staff action is also written to the admin audit log. Submissions appear in the account export and are erased with the account (cascade); reviews and events keep the row with the reviewer set to `null`.

## Nolo pull request job

- `submission-pull-request.ts` (job) and `nolo-repository.ts` (GitHub calls through `@/shared/github-app`, the Nolo GitHub App on `NOLO_REPOSITORY`). Without `NOLO_APP_ID`, `NOLO_PRIVATE_KEY` and `NOLO_INSTALLATION_ID` the job does nothing.
- Pending work is a query, not a queue: `in_progress` submissions whose `pr_revision` is behind `revision`. A run claims the row with `pr_claimed_at` (10 minute lease), so two runs never build the same submission.
- The job reparses the stored definition, validates it again, regenerates the files with `buildTextFiles`, reads the images from R2 and writes one commit on top of `NOLO_BASE_BRANCH` on `creator/<slug>-<first 8 chars of the id>`. A new revision force-pushes the same branch and reuses the open pull request. Labels `presence` and `creator`.
- A new presence whose folder already exists is never overwritten: `changes_requested` with a note and a `pr.collision` event. An update removes locale files the definition no longer has.
- Failures store `pr_error` and release the claim. Runs: right after an admin publish, `POST /presence-submissions/:id/pull-request` (admin retry) and `POST /presence-submissions/pull-requests` (scheduler, `CREATOR_WEBHOOK_SECRET`).
- User text in the pull request body is wrapped in inline code so it cannot mention anyone or inject Markdown.

## Automatic translation

- `submission-translation.ts`, through `@/shared/workers-ai` (Cloudflare Workers AI REST API, JSON mode, model `WORKERS_AI_MODEL`, default `@cf/google/gemma-4-26b-a4b-it`). Runs inside the PR job when the submission has `translate`; without `WORKERS_AI_API_TOKEN` the job fails with a stored `pr_error` and retries later.
- Targets `TRANSLATION_LOCALES` (all 11 site locales, `SUPPORTED_LOCALES`), one call per language, four in parallel. Texts: `description`, `longDescription`, features, and per page `details`, `state`, button label.
- `{name}` tokens are masked as `{0}`, `{1}` before the call and restored after. A text whose tokens differ, that still holds a mask, or that is missing keeps the base text for that language. Too long texts are cut on a word boundary to the creator limits (120, 600, 80, 128, 32).
- The translated definition is set to `translationMode: "manual"` with every target in `locales`; it is used for the PR only, the stored revision keeps what the author sent.

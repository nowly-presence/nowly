# Presence submissions

Creator submissions, their revisions, reviews and history. Contract with the extension: `apps/extension/docs/presence-creator/README.md` (sections 6 and 10).

## Model

- `creator_presences`: the published declarative definition of a creator presence (`revision` increments on each publication). Only these presences can be edited in the creator; a catalog presence without one answers `409 NOT_CREATOR_PRESENCE`.
- `presence_submissions`: one per author and draft id (`definition.id`), `kind` is `create` or `update` (with `baseRevision`, the creator presence revision it started from).
- `presence_submission_revisions`: every send or resend is a new numbered revision with the definition, the server-generated files and `changes` (`diffDefinitions` from `@nowly/presence-creator`, field by field and per page name).
- `presence_submission_reviews`: `approve`, `comment`, `request_changes` or `reject`, tied to the revision reviewed, with an optional message and field comments (`{ field, page?, message }`).
- `presence_submission_events`: the history shown to authors and reviewers (`submitted`, `resubmitted`, `review.<verdict>`, `publish` with `withoutReview`, `published`).

## Rules

- The server rebuilds everything: `parseCreatorDefinition` (strict schema, unknown fields dropped), author overwritten from the account, files regenerated with `buildTextFiles`. Never store or publish what the client sent as files.
- Images are checked and stored in phase F: until then `validateDraft` issues of the `visuals` step are ignored and `assets` is not stored.
- Statuses follow `submission-status.ts`. Authors can resend only in `changes_requested` or `rejected`. Every review or publish names the revision it acts on (`409 STALE_REVISION` otherwise) and runs in a transaction that locks the submission row.
- Moderators (`review`) approve, comment, request changes or reject; nobody reviews their own submission. Only admins (`publish`) publish: from `approved`, or directly from `submitted`, which the history records as `withoutReview`. Publishing moves the submission to `in_progress`; the PR job (phase F) then opens the pull request.
- `POST /presence-submissions/published` is the CI webhook (`CREATOR_WEBHOOK_SECRET`): it sets `published` and writes the definition to `creator_presences`.
- A submission is visible only to its author and to reviewers (`404` for anyone else, never `403`, so ids do not leak).
- Every staff action is also written to the admin audit log. Submissions appear in the account export and are erased with the account (cascade); reviews and events keep the row with the reviewer set to `null`.

# Staff area

Moderation and administration UI at `/moderation/*`, in the `(staff)` route group with its own sidebar shell (`staff-shell.tsx`), separate from the account navbar. The layout redirects anonymous users to `/sign-in` and users without any capability to `/profile`.

- Sidebar entries and their capability live in `lib/staff-nav.ts` (overview and review: `review`, presences: `publish`, users and audit: `manage`, announcements: `announce`). Add a page there and under `app/[locale]/(staff)/moderation/`.
- Review board: kanban by submission status with a column selector (default Submitted, Changes requested, Approved) and a peek panel with quick request-changes and reject. The full review is `/moderation/review/[id]`: five checklist sections (identity, images, texts, pages, domains), sections marked "To fix" are sent as field comments with the verdict.
- Users page is a rights matrix built from `ROLE_CAPABILITIES`; the staff list comes from `GET /admin/users/staff`. Audit events carry `actorName` from the API.
- Audit labels are keyed `audit-<action with dots replaced by dashes>` in the `staff` messages.
- Authors still use `/creations/[id]` for their own submissions.

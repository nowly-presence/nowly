# Diagnostics

Diagnostic screen shown when the user reports an issue (host disconnected, presence failing...). `user-diagnostic-card.tsx` renders a checklist (`status-row.tsx` per row).

## Add a new diagnostic check

1. Add the new check's type/id to `diagnostic-status.ts`.
2. Populate it inside `use-support-diagnostic.ts` — pull the actual state from the `background/` (via `sendMessage` from `@/lib/messages`, same pattern as the existing checks), don't inline a new state source directly in the component.
3. Add a `<StatusRow>` for it in `user-diagnostic-card.tsx`.

## Notable dependencies
`background/` (native host state via the message router).

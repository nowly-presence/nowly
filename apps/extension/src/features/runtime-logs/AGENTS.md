# Runtime Logs

Screen listing runtime logs emitted by active presences via `presence.info()`/`presence.error()` (the SDK's logging API), collected by the `background/`. `runtime-logs-view.tsx` renders them.

## Add a new log level or filter

1. Add the level/field to the entry shape in `runtime-logs.model.ts`.
2. Confirm the `background/` actually forwards that field when a presence calls `presence.info()`/`presence.error()` — this feature only displays what it receives via the message router, it doesn't generate log entries itself.
3. Add the filter control to `runtime-logs-view.tsx`.

## Notable dependencies
`background/` (log collection via the message router), `@nowly/sdk` (`info`/`error` methods of the presence contract).

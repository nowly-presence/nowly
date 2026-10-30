# Discord IPC

Explains that Discord runs as administrator and Windows refuses its IPC pipe. The page only explains: never start anything as administrator or run a system action.

- Detect only the native code `NATIVE_ERROR_CODES.discordIpcAccessDenied` (`isNativeErrorCode`), never the localized "Access is denied" text.
- Episode logic is pure in `shared/discord-ipc-prompt.ts` (tested); the episode lives in `chrome.storage.session` so a worker respawn never reopens the page. The page is pushed once per episode, only while no feature reveal is active.
- Preview: `?native=ipc-denied&scenario=idle` (the first Reconnect fails, the second succeeds).

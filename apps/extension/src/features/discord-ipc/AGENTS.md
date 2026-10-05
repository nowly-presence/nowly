# Discord IPC

Pushed page (`Route` `discord-ipc`) explaining that Discord blocks Nowly because it runs as administrator while the browser and Nowly Desktop do not (Windows refuses access to `\\.\pipe\discord-ipc-0`).

## How it works

- Detection uses only the stable native code `NATIVE_ERROR_CODES.discordIpcAccessDenied` through `isNativeErrorCode`, on `PONG` and `ERROR` responses. Never match the "Access is denied" text, it is localized by Windows.
- Episode logic is pure and tested in `shared/discord-ipc-prompt.ts`: an episode starts when the code appears while absent, ends on the first `PONG` without it. `ERROR` without the code, `OK` and `CONNECTED` leave it as is.
- The background (`background/services/native.ts`) keeps the episode in `chrome.storage.session` (`discordIpcIssue`), so a worker respawn does not reopen the page, and mirrors it as `code` and `codePrompted` on `NativeStatus` while the host is connected.
- `discord-ipc-prompt.tsx` (mounted in `app.tsx`) pushes the page once per episode, 1.5 s after it becomes due (like the review prompt), only while no feature reveal is active, then sends `ACKNOWLEDGE_DISCORD_IPC_ISSUE`. Closing the page never brings it back during the same episode. The onboarding is not affected (the prompt is not mounted there), and an open page holds back feature reveals and the review prompt, which need an empty route stack.
- Reopened by hand from the Activity tab (`features/activity/discord-ipc-alert.tsx`, shown above the "Now" card) and from the Discord row of the connection diagnostics.
- "Reconnect" reuses `CONNECT_NATIVE` then reads `GET_NATIVE_STATUS`; the page switches to a "connected again" state as soon as Discord is connected without the code. "Learn more" opens the troubleshooting page of the docs in the interface language (`docsUrl`).
- Never start anything as administrator and never run a system action: the page only explains.

## Preview

`?native=ipc-denied` (use with `scenario=idle`): the first "Reconnect" stays blocked, the second one resolves the problem.

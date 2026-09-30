# Layout

App shell: header (wordmark, connection pill, pause), floating dock, and the navigation layers.

## Gotchas

- Each tab and each pushed route is a `Layer` that stays mounted while hidden, so state survives navigation. Chrome zeroes `scrollTop` when a layer turns invisible/inert, so `Layer` records its offset while active and restores it when it becomes active again.
- The dock measures labels off-screen; when they don't all fit, inactive items collapse to icons and the active one keeps its label.
- Re-selecting the current tab scrolls it back to the top.
- `Wordmark` renders the lockup 40px high (`h-10`, store and canary alike), the size the header had before the side panel rework; the 2.2.0 migration had shrunk it to 22px (30px canary), which read far too small in the panel. `min-w-0` lets it shrink when the header is tight.

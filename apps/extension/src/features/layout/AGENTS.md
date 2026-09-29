# Layout

App shell: header (wordmark, connection pill, pause), floating dock, and the navigation layers.

## Gotchas

- Each tab and each pushed route is a `Layer` that stays mounted while hidden, so state survives navigation. Chrome zeroes `scrollTop` when a layer turns invisible/inert, so `Layer` records its offset while active and restores it when it becomes active again.
- The dock measures labels off-screen; when they don't all fit, inactive items collapse to icons and the active one keeps its label.
- Re-selecting the current tab scrolls it back to the top.
- The canary lockup (icon + "Nowly Canary") is wider with smaller glyphs than the store lockup, so `Wordmark` renders it at 30px high instead of 22px.

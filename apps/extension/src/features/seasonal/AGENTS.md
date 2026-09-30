# Seasonal

App-wide seasonal moments that are not a screen. The seasonal theme itself (periods, tokens, `SeasonProvider`) is described in the root `AGENTS.md`.

## Halloween prank

- `HalloweenPrank` is mounted once at the end of `app.tsx`, so it never shows during onboarding. It needs the state ready and the Seasonal theme (`useSeason().seasonal`).
- It fires on October 31 (local date), 700 ms after the panel opens, once per year: `halloweenPrank` in `chrome.storage.local` (`shared/halloween-prank.ts`, tested) stores `lastShownYear`, written as soon as the prank shows so closing the panel mid-way does not replay it. If the panel stays open across midnight into the 31st, it fires then.
- Scene (`halloween-prank.tsx`, door in `halloween-door.tsx`): a closed arched door fills the blurred panel, its handle pulses and glows like a game hint, with a blinking "Knock knock" chip under it. The handle is a focused button (`prank.open`), so Enter works too. Pressing it swings the door open in about a quarter second, then Nolo in his witch hat (`CostumedNolo costume="halloween"`) bursts out of the doorway at twice his size with a small wobble and a "Boo!" (no image, sound or flash). After 1.7 s the door fades, Nolo settles and opens a bubble that streams `prank.trickOrTreat` (`ui/streaming-text.tsx`, tap to finish). The button and Escape close it at any step. Under reduced motion nothing pulses or blinks, the door fades out instead of swinging and Nolo fades in at normal size.
- Door colours are illustration tokens in `ui/tokens.css` (`--door`, `--door-panel`, `--door-edge`, `--door-handle`, `--doorway`), identical in light and dark.
- Replay: canary developer settings ("Replay the Halloween prank") or `?prank=1` in the preview set `replay: true`, which ignores the date (still requires Seasonal). Replaying on another day keeps the stored `lastShownYear`, so the real October 31 still fires.
- The trick-or-treat line is the idiomatic phrase of each locale, not a literal translation.

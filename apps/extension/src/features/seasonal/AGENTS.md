# Seasonal moments

The Halloween prank and the season moments mount once at the end of `app.tsx` (never during onboarding). Both need seasonal themes on and show once per year: state in `chrome.storage.local`, written as soon as they show (`shared/halloween-prank.ts`, `shared/season-moments.ts`, tested).

- The prank fires every October 31, even without the Halloween theme; season moments cover every other period on its moment day.
- No image, sound or flash. Under reduced motion nothing pulses, bursts or counts down: everything fades.
- Colours only through tokens in `ui/tokens.css` (door, countdown).
- Greetings and the trick-or-treat line are idiomatic in each locale, never literal translations.
- Replay: canary developer settings, or `?prank=1` and `?moment=1` in the preview (ignores the date, keeps the stored years).

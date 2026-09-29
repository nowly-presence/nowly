# Review

One-time prompt asking the user to rate Nowly on their browser's store (`shared/browser-links.ts` `storeReviews`: Chrome Web Store or Firefox Add-ons, picked from the build's `BROWSER`).

## Gotchas

- State lives in `chrome.storage.local` under `reviewPrompt` (`shared/review-prompt.ts`): `firstSeenAt` is recorded the first time the main shell renders after onboarding, `dismissedAt` is set by any outcome (rate, "No thanks", close button, backdrop, Escape) and by the "Rate Nowly" link in Settings. Once set, the prompt never comes back.
- It shows only when `REVIEW_PROMPT_DELAY_MS` (3 days) has passed since `firstSeenAt`, at least one presence is installed and no route is pushed, 1.5 s after those conditions hold.
- Developer mode has "Replay review prompt" (resets `firstSeenAt` to 0); the preview takes `?review=1`.

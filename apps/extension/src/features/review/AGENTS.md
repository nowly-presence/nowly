# Review prompt

- Shown at most once: any outcome (rate, dismiss, Escape, the Settings link) sets `dismissedAt` in `reviewPrompt` (`shared/review-prompt.ts`) and it never returns.
- Only after `REVIEW_PROMPT_DELAY_MS` since `firstSeenAt`, with a presence installed and no pushed route.
- Replay: developer mode "Replay review prompt"; preview `?review=1`.

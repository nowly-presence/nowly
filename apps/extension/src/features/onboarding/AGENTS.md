# Onboarding

First-run flow shown until `onboarding.onboardingCompleted` (or when `devReplayOnboarding` is set from developer settings).

## Add a step

1. Add its id to `STEPS` in `onboarding-view.tsx` and render it there.
2. Create `steps/<name>-step.tsx` using `OnboardingStepLayout` (title, description, sticky footer). Every step offers a way forward even when its check fails ("Skip for now").
3. Completion goes through `SET_ONBOARDING`; the background tracks `onboarding_completed`.

## Gotchas

- The user-scripts step polls `GET_USER_SCRIPTS_STATUS`; Firefox needs `chrome.permissions.request` inside the click handler.
- `hero-stack.tsx` fans three live cards: faded cards sit on an opaque canvas backing so the one behind never bleeds through.

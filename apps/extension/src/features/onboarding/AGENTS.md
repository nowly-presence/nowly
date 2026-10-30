# Onboarding

Steps are listed in `STEPS` (`onboarding-view.tsx`), one `steps/<name>-step.tsx` each, built on `OnboardingStepLayout`.

- Every step offers a way forward even when its check fails ("Skip for now"). Completion goes through `SET_ONBOARDING`.
- `privacy-step.tsx` is the only onboarding place touching analytics consent, which stays `false` unless the user opts in. Legal acceptance never sets it.
- Never mention the account in the onboarding.
- Firefox needs `chrome.permissions.request` inside the click handler (scripts step).

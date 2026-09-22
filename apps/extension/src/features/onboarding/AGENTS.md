# Onboarding

The first-open flow: language choice, then a guided checklist walking the user through connecting the native host, Discord, and installing/testing a presence (uses YouTube as the test presence). `onboarding-overlay.tsx` is the full-panel screen, `use-onboarding-steps.tsx` computes the checklist's live status.

## Add a step to the guided checklist

`useOnboardingSteps` (`use-onboarding-steps.tsx`) returns a fixed `GuidedStep[]` array built from live diagnostic state (`buildDiagnosticSnapshot`, from `features/diagnostics/diagnostic-status.ts`), it isn't a generic step-registry:

1. Compute the new step's `StepStatus` (`"loading" | "success" | "error"`) from the relevant field(s) of `buildDiagnosticSnapshot(...)`'s snapshot, following the pattern of `hostStatus`/`discordStatus`/`youtubeInstallStatus` near the top of the hook.
2. Add the step object (`{ icon, status, title, message, details?, actions? }`, see `GuidedStep` in `onboarding.types.ts`) to the returned array, in the position it should appear.
3. If the step needs a new diagnostic signal that `buildDiagnosticSnapshot` doesn't already expose, add it there first (see `diagnostics`'s `AGENTS.md`).

## Add an onboarding step unrelated to the checklist (e.g. a new intro slide)

1. Add the new step to whatever step-sequencing state `onboarding-overlay.tsx` uses to switch between language-picker / intro / checklist / ChromeOS-waitlist screens.
2. Update `progress-dots.tsx`/`step-icon.tsx` if the new step should count toward the visible progress indicator.
3. Update `onboarding.utils.ts`'s completion logic so finishing the new step is required (or not) for onboarding to be marked done.

## Gotchas
- The checklist step statuses cascade: e.g. `discordStatus` is `"error"` only once `hostStatus` is `"success"` but Discord still isn't connected, otherwise it stays `"loading"` — a new step slotted between two existing ones should follow the same "loading until its prerequisite succeeds" convention, not report `"error"` prematurely.
- ChromeOS is a distinct path (`useIsChromeOs`) because native host connection isn't available there — `chromeos-waitlist-form.tsx` replaces the checklist entirely on that platform, it doesn't just hide a few steps.

## Notable dependencies
`features/diagnostics` (`buildDiagnosticSnapshot`), `features/layout` (`Header` reused here), the extension's local storage (`background/storage`).

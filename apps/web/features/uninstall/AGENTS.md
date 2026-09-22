# Uninstall

Rendered by `app/[locale]/uninstall`: `uninstall-view.tsx` captures a feedback reason and offers to reinstall.

## Add a new uninstall reason option

1. Add the reason's translation key to the relevant namespace read by `uninstall-view.tsx`.
2. Add the reason to whatever list/enum `uninstall-view.tsx` maps over to render the option buttons/radio group.
3. Extend the analytics event sent on selection in `lib/analytics.ts` (root, shared with other features) so the new reason is actually tracked — adding the UI option alone won't show up in `apps/insights` without this.

## Notable dependencies
`lib/analytics.ts`, `lib/constants.ts`, `components/extension-store-button.tsx` (root, shared).

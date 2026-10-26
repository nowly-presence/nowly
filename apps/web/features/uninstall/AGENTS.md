# Uninstall

Rendered by `app/[locale]/uninstall`: `uninstall-view.tsx` offers authenticated device-data erasure, keeping data, and reinstalling.

## Truth and privacy boundaries

1. Opening the page is not cleanup success or proof of browser uninstall. Only a successful authenticated DELETE confirms device-data erasure.
2. With website opt-in, `uninstall_page_opened` counts an observed landing once per mount. No device ID, token, query, feedback or URL is sent to Umami.
3. Browser uninstall URLs are best effort; never infer uninstall from silence. Keep device credentials confined to existing functional endpoints.

## Notable dependencies
`lib/telemetry.ts`, `lib/constants.ts`, `components/extension-store-button.tsx` (root, shared).

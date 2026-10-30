# Desktop

Shows what the native release manifest contains (`DESKTOP_LATEST_MANIFEST_URL`, published by `host-release.yml`). Artifacts are produced by the release workflow, never here.

- New artifact: add the field to `Manifest` and `DesktopRelease` (`lib/desktop-release.ts`), a fallback in `fallbackRelease()` when it is required, and the link in `desktop-view.tsx`. Optional artifacts and `version` can be `null`: hide the link.
- `getDesktopRelease()` never throws (it falls back silently) and revalidates every 60 s: when a link is missing, inspect the manifest JSON first.

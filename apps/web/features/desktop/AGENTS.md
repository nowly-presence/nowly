# Desktop

`app/[locale]/desktop` renders `components/desktop-view.tsx`: per-platform download links.

## Add an artifact or platform variant

1. `getDesktopRelease()` (`lib/desktop-release.ts`) fetches `DESKTOP_LATEST_MANIFEST_URL`, a JSON manifest published by `apps/native`'s `host-release.yml` (tag `native-vX.Y.Z`), and reads `manifest.<platform>.<artifact>.url`. Add the field to `Manifest` and `DesktopRelease`.
2. Required artifacts need a fallback in `fallbackRelease()` (`` `${CDN_INSTALLER_BASE_URL}/nowly-<name>` ``). Optional ones (`macos.archive`, `linux.deb`) are `null` when missing, and `version` is `null` when the manifest has none: `desktop-view.tsx` must handle `null` by hiding the link.
3. Render the link in `desktop-view.tsx`.
4. The artifact itself must be produced and published by the native release workflow; this feature only shows what the manifest contains.

## Gotchas

- `getDesktopRelease()` never throws: a failed fetch, non-OK response or parse error returns `fallbackRelease()` silently. If a link is missing, inspect the manifest JSON first.
- The fetch uses `next: { revalidate: 60 }`: a new release can take up to a minute to appear.

## Notable dependencies
`lib/constants.ts` (`CDN_INSTALLER_BASE_URL`, `DESKTOP_LATEST_MANIFEST_URL`), `apps/native`.

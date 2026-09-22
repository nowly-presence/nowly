# Desktop

Rendered by `app/[locale]/desktop`: `desktop-view.tsx` shows per-platform download links.

## Add a new artifact/platform variant

1. `getDesktopRelease()` in `lib/desktop-release.ts` fetches `DESKTOP_LATEST_MANIFEST_URL` (a JSON manifest published by `apps/native`'s release pipeline, `host-release.yml`) and reads `manifest.<platform>.<artifact>.url`. Add the new field to the `Manifest` type and to `DesktopRelease`.
2. Add a matching fallback URL in `fallbackRelease()` (pattern: `` `${CDN_INSTALLER_BASE_URL}/nowly-<name>` ``) — this is what's shown if the manifest fetch fails or the field is missing, so the download button never links to nothing.
3. Add the new artifact link to `desktop-view.tsx`'s per-platform section.
4. The actual artifact needs to be produced and published by `apps/native`'s release workflow (`host-release.yml`, triggered by a `native-vX.Y.Z` tag) — this feature only displays whatever the manifest already contains.

## Gotchas

- `getDesktopRelease()` never throws — any fetch/parse failure returns `fallbackRelease()` silently. If a new platform's link is missing in the UI, check the manifest JSON directly rather than assuming the fetch failed.
- The manifest fetch is cached for 60s (`next: { revalidate: 60 }`) — a freshly published release can take up to a minute to show up.

## Notable dependencies
`lib/constants.ts` (root, `CDN_INSTALLER_BASE_URL`/`DESKTOP_LATEST_MANIFEST_URL`), `apps/native` (produces the manifest and artifacts).

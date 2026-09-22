# Assets

Serves a presence's assets (logos, icons...) from the CDN/storage: `GET /:slug/assets/:type`.

## Add a new asset type

1. Add the type's resolution logic to `assets.service.ts` — it maps `(slug, type)` to a storage path/URL.
2. No route change needed: `assets.routes.ts`'s `GET /:slug/assets/:type` already accepts any `type` string and passes it through.
3. The actual asset file must be published for that presence via `packages/internal-cli`'s R2 sync (`pnpm --filter @nowly/internal-cli r2:sync`) — this feature only serves what's already in storage, it doesn't upload anything.

## Notable dependencies
Presence CDN/storage (`packages/internal-cli`'s R2 commands publish it, `packages/presences` is the source).

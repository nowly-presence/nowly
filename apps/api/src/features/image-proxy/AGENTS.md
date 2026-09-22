# Image Proxy

Proxies/caches external images because Discord can't always load third-party CDN images directly. Four routes cover the same need through different call shapes: `POST /images-proxy` + `GET /images-proxy/:id`, and the query-string variants `GET /i` (`?u=`) and `GET /image-proxy` (`?url=&service=`).

## Allow a new external host to be proxied

This feature doesn't own a host allowlist — that lives per-presence. Add the host to the presence's `imageProxy.hostSuffixes` in its `metadata.json` (`packages/presences`), validated against `packages/sdk`'s `Metadata` type. Don't add host-checking logic here; `image-proxy.service.ts` resolves/caches whatever URL it's given.

## Add a new proxy entry point/shape

1. Add the route in `image-proxy.routes.ts`.
2. Reuse the resolution/caching logic already in `image-proxy.service.ts` rather than duplicating it — the four existing routes exist because different callers (presence scripts, other internal callers) historically needed different request shapes, not because the underlying logic differs.

## Notable dependencies
Consumed by the extension and by presences declaring `imageProxy` in their metadata.

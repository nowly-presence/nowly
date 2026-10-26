# Image Proxy

Proxies and caches external images for Discord. Entry points share `image-proxy.service.ts`: `POST /images-proxy` + `GET /images-proxy/:id`, `GET /i?u=`, `GET /image-proxy?url=&service=`.

- Host rules come from presence metadata (`imageProxy.hostSuffixes` in `packages/presences`, typed by `@nowly/sdk`) and the service selected by the request. Resolution, fetching and caching stay in the service; routes only adapt request shapes. Reuse the service for any new entry point.
- Security-sensitive: this endpoint fetches caller-supplied URLs. Any change to host matching, redirects, size limits or cache headers needs regression tests (`test/image-proxy.test.ts`) and a deliberate decision, not an incidental refactor.

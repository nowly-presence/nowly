# Image proxy

Security-sensitive: it fetches caller-supplied URLs.

- Every entry point goes through `image-proxy.service.ts`; routes only adapt request shapes. Reuse the service for new entry points.
- Allowed URLs: HTTPS only, on a host equal to or under one of the presence's `imageProxy.hostSuffixes`. An explicit `service` only selects that presence's config; it never widens its hosts.
- Redirects are followed by hand (at most 3) and every hop is re-checked against the same hosts. Never go back to `redirect: "follow"`.
- Bodies are streamed and cut at `MAX_IMAGE_BYTES` (5 MB) whether or not `Content-Length` is sent; never buffer a whole response first.
- Only `image/*` responses are served, never `image/svg+xml` (it can run scripts on the API origin); a response without `Content-Type` is served as `image/webp`.
- Any change to host matching, redirects, size limits or cache headers needs regression tests in `test/image-proxy.test.ts` and a deliberate decision, never an incidental refactor.

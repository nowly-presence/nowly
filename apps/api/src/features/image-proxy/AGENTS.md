# Image proxy

Security-sensitive: it fetches caller-supplied URLs.

- Every entry point goes through `image-proxy.service.ts`; routes only adapt request shapes. Reuse the service for new entry points.
- Allowed URLs: HTTPS only, on a host equal to or under one of the presence's `imageProxy.hostSuffixes`. An explicit `service` only selects that presence's config; it never widens its hosts.
- Redirects are followed by hand (at most 3) and every hop is re-checked against the same hosts. Never go back to `redirect: "follow"`.
- Any change to host matching, redirects, size limits or cache headers needs regression tests in `test/image-proxy.test.ts` and a deliberate decision, never an incidental refactor.

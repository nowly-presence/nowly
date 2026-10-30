# Image proxy

Security-sensitive: it fetches caller-supplied URLs.

- Every entry point goes through `image-proxy.service.ts`; routes only adapt request shapes. Reuse the service for new entry points.
- Allowed hosts come from presence metadata (`imageProxy.hostSuffixes`) and the requested service.
- Any change to host matching, redirects, size limits or cache headers needs regression tests in `test/image-proxy.test.ts` and a deliberate decision, never an incidental refactor.

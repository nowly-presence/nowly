# Consent

- Website consent is local to the site (`lib/telemetry.ts`) and never grants extension consent. Extension consent goes through the extension bridge; withdrawal erases local telemetry markers and sends no event.
- `packages/telemetry` is the closed event and property contract. Before widening it, update the disclosures in all locales and the privacy manifest. No persistent site-extension identity.
- Device export and erasure cover historical analytics as functional service data; new aggregate events cannot be located by device ID.

# Security

Exposes the public key (`GET /public-key`) used to verify signed presence bundles.

## Rotate the signing key

1. Generate the new key pair with `packages/internal-cli`'s signing tooling.
2. Update `security.routes.ts` to serve **both** the old and new public keys during the transition (e.g. return an array, or add a `?version=` param) — clients pinned to the old key must keep validating during rollout.
3. Re-sign new presence publishes with the new private key (`packages/internal-cli`'s `push`/`archive` commands).
4. Once all active clients (extension, CLI) have picked up the new key, remove the old one from the response.

## Notable dependencies
`packages/internal-cli` (signing at publish time), `@nowly/sdk`/`packages/cli` (verification on the build/consumption side).

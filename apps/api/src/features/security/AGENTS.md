# Security

`GET /security/public-key` returns `{ publicKey: string }`, the key used to verify signed presence releases.

- The response shape is a contract with the extension verifier: keep `publicKey` a string.
- Key rotation needs a coordinated plan (extension verifier, signing tooling, republish) before the response changes; do not replace the field with an array unilaterally.

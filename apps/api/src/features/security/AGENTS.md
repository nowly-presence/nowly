# Security

`GET /security/public-key` returns `{ publicKey: string }`, a contract with the extension's release verifier. Key rotation needs a coordinated plan (verifier, signing tooling, republication); never change the response shape unilaterally.

# Security Policy

## Supported Versions

Nowly is a monorepo containing the website, API, browser extension, native host, and related tooling. Security fixes are developed against the `stable` branch and the latest production release.

| Version or channel | Security support |
| ------------------ | ---------------- |
| Latest production release | Supported |
| `stable` branch | Supported |
| Canary, preview, and development builds | Best effort only |
| Older releases | Not supported |

If you are running an older release, update to the latest production release before reporting an issue whenever possible. Do not delay a report if updating is not safe or possible.

## Reporting a Vulnerability

Please do **not** report security vulnerabilities in a public GitHub issue, pull request, or Discord channel.

Use one of these private channels:

1. **GitHub Private Vulnerability Reporting** (preferred): [Report a vulnerability privately](https://github.com/nowly-presence/nowly/security/advisories/new)
2. **Email:** [contact@nowly.me](mailto:contact@nowly.me) with the subject `[SECURITY] Nowly vulnerability report`

Include as much of the following as you can:

- A concise description of the vulnerability and its security impact.
- The affected repository, application, package, endpoint, or release.
- Reproduction steps or a minimal proof of concept.
- Required permissions, configuration, or user interaction.
- Whether the issue involves personal data, credentials, signing keys, or production infrastructure.
- Any suggested mitigation or fix.

Please redact secrets, personal data, access tokens, and private user information from reports and proof-of-concept code.

## What to Expect

- We aim to acknowledge a report within **7 calendar days**.
- We will investigate the report privately and provide updates when the assessment or remediation status changes.
- We may ask for additional information to reproduce or assess the issue.
- If the report is accepted, we will coordinate a fix, assess affected releases, and publish a security advisory when appropriate.
- If the report is declined, we will explain the reason when possible.
- We will credit reporters in the advisory only with their permission.

Please allow reasonable time for investigation and remediation before making the vulnerability public. We will coordinate disclosure timing with the reporter whenever practical.

## Scope

This policy covers security issues in the main Nowly repository, including the website, API, browser extension, native host, and release tooling maintained here.

The SDK, CLI, presences, and internal CLI are maintained in separate repositories. Reports about those components should be submitted through the security contact of the corresponding repository when available. If you are unsure which repository is affected, report it here and we will route it.

## Out of Scope

The following are generally outside the scope of this policy unless they demonstrate a concrete security impact in Nowly:

- Vulnerabilities in Discord, browsers, operating systems, hosting providers, or third-party services.
- Reports that only describe missing security headers or best-practice differences without an exploitable impact.
- Self-XSS, phishing, social engineering, or attacks requiring local administrator access.
- Denial-of-service reports against public infrastructure without prior coordination.
- Spam, rate-limit noise, or automated scanner output without a reproducible security impact.

This list is guidance, not a waiver for a report that demonstrates a real security impact.

# @nowly/env

Typed environment access for the Nowly monorepo.

## Exports

| Export | Surface | Notes |
| --- | --- | --- |
| `@nowly/env/server` | API server only | Contains secrets and throws when required values are missing. |
| `@nowly/env/client` | Next.js app | Public web values and server-side web fetch config. |
| `@nowly/env/extension` | Browser extension | Public Vite values only. |

## Variables

### server (API)

| Variable | Required | Default |
| --- | --- | --- |
| `PORT` | No | `3001` |
| `FRONTEND_URL` | No | `http://localhost:3000` |
| `DATABASE_URL` | No | - |
| `JWT_SECRET` | Yes | - |
| `DISCORD_CLIENT_ID` | Yes | - |
| `DISCORD_CLIENT_SECRET` | Yes | - |
| `BETTER_AUTH_SECRET` | Yes | - |
| `BETTER_AUTH_URL` | No | `http://localhost:3001` |
| `PRESENCE_SIGNING_PRIVATE_KEY` | Yes | - |
| `API_SECRET_KEY` | Contextual | - |
| `DEVICE_TOKEN_SECRET` | No | - |
| `DISCORD_WEBHOOK_REPORT_URL` | No | - |
| `STATUS_CRON_SECRET` | No | - |
| `STATUS_CHECK_INTERVAL_HOURS` | No | `1` |
| `STATUS_SAMPLE_LIMIT` | No | `168` |
| `CREATOR_WEBHOOK_SECRET` | No | - |
| `NOLO_APP_ID` | No | - |
| `NOLO_PRIVATE_KEY` | No | - |
| `NOLO_INSTALLATION_ID` | No | - |
| `NOLO_REPOSITORY` | No | `nowly-presence/presences` |
| `NOLO_BASE_BRANCH` | No | `stable` |
| `WORKERS_AI_ACCOUNT_ID` | No | `R2_ACCOUNT_ID` |
| `WORKERS_AI_API_TOKEN` | No | - |
| `WORKERS_AI_MODEL` | No | `@cf/google/gemma-4-26b-a4b-it` |

### client (Next.js web)

| Variable | Required | Default |
| --- | --- | --- |
| `PRESENCE_API_URL` | No | `https://api.nowly.me` |
| `NEXT_PUBLIC_API_BASE_URL` | No | `https://api.nowly.me` |
| `NEXT_PUBLIC_BASE_URL` | No | `https://nowly.me` |
| `NEXT_PUBLIC_DOCS_BASE_URL` | No | `https://docs.nowly.me` |
| `NEXT_PUBLIC_EXTENSION_ID` | No | `kmnlnfldimgneaopdihplkebobckcjpf` |
| `NEXT_PUBLIC_ADSENSE_ENABLED` | No | `false` |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | No | - |
| `NEXT_PUBLIC_ADSENSE_LANDING_SLOT` | No | - |
| `NEXT_PUBLIC_ADSENSE_LIBRARY_SLOT` | No | - |

### extension (Vite)

| Variable | Required | Default |
| --- | --- | --- |
| `VITE_WEB_BASE_URL` | No | `https://nowly.me` |
| `VITE_API_BASE_URL` | No | `https://api.nowly.me` |
| `VITE_CDN_BASE_URL` | No | - |

## Status check endpoint

`STATUS_CRON_SECRET` (server export, see above) protects this endpoint:

```bash
curl -fsS -H "Authorization: Bearer $STATUS_CRON_SECRET" https://api.nowly.me/status/check
```

## Creator pull request job

`NOLO_APP_ID`, `NOLO_PRIVATE_KEY` (PEM, newlines may be escaped as `\n`) and `NOLO_INSTALLATION_ID` enable the Nolo GitHub App that opens the pull request of a published submission. A scheduler retries pending ones with `CREATOR_WEBHOOK_SECRET`:

```bash
curl -fsS -X POST -H "Authorization: Bearer $CREATOR_WEBHOOK_SECRET" https://api.nowly.me/presence-submissions/pull-requests
```

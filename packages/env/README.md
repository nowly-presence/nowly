# @nowly/env

Typed environment access for the Nowly monorepo.

## Exports

| Export | Surface | Notes |
| --- | --- | --- |
| `@nowly/env/server` | API server only | Contains secrets and throws when required values are missing. |
| `@nowly/env/client` | Next.js app | Public web values and server-side web fetch config. |
| `@nowly/env/extension` | Browser extension | Public Vite values only. |
| `@nowly/env/cli` | Internal CLI (admin tooling) | API and Cloudflare R2 publishing config. |

## Variables

### server (API)

| Variable | Required | Default |
| --- | --- | --- |
| `PORT` | No | `3001` |
| `FRONTEND_URL` | No | `http://localhost:3000` |
| `DATABASE_URL` | No | - |
| `JWT_SECRET` | Yes | - |
| `ANONYMOUS_HASH_SECRET` | Yes | - |
| `DISCORD_CLIENT_ID` | Yes | - |
| `DISCORD_CLIENT_SECRET` | Yes | - |
| `DISCORD_REDIRECT_URI` | Yes | - |
| `PRESENCE_SIGNING_PRIVATE_KEY` | Yes | - |
| `API_SECRET_KEY` | Contextual | - |
| `ANALYTICS_ALLOWED_DISCORD_IDS` | No | - |
| `DEVICE_TOKEN_SECRET` | No | - |
| `OPENAI_API_KEY` | No | - |
| `SUPPORT_PASS_DEFAULT_MAX_DEVICES` | No | `5` |
| `KOFI_WEBHOOK_TOKEN` | No | - |
| `GITHUB_SPONSORS_WEBHOOK_SECRET` | No | - |
| `AWS_ACCESS_KEY_ID` | No | - |
| `AWS_SECRET_ACCESS_KEY` | No | - |
| `AWS_REGION` | No | `us-east-1` |

| `SUPPORT_EMAIL_FROM` | No | - |
| `SUPPORT_EMAIL_REPLY_TO` | No | - |
| `SUPPORT_REDEEM_URL` | No | - |

### client (Next.js web)

| Variable | Required | Default |
| --- | --- | --- |
| `PRESENCE_API_URL` | No | `https://api.nowly.me` |
| `NEXT_PUBLIC_API_BASE_URL` | No | `https://api.nowly.me` |
| `NEXT_PUBLIC_BASE_URL` | No | `http://localhost:3000` |
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

### cli (internal-cli)

| Variable | Required | Default |
| --- | --- | --- |
| `API_URL` | No | `https://api.nowly.me` |
| `API_SECRET_KEY` | No | - |
| `R2_BUCKET` | No | `nowly` |
| `R2_PUBLIC_URL` | No | `https://cdn.nowly.me` |
| `R2_ACCESS_KEY_ID` | No | - |
| `R2_SECRET_ACCESS_KEY` | No | - |
| `R2_ACCOUNT_ID` | No | - |
| `CLOUDFLARE_API_TOKEN` | No | - |
| `CLOUDFLARE_ZONE_ID` | No | - |

## Additional variables

These are read directly from `process.env` (not validated by `@nowly/env`):

| Variable | Default | Description |
| --- | --- | --- |
| `STATUS_CRON_SECRET` | - | Secret for the status check cron endpoint |
| `STATUS_CHECK_INTERVAL_HOURS` | `1` | Interval in hours between status checks |
| `STATUS_SAMPLE_LIMIT` | `168` | Number of status samples to keep |

Status check endpoint:

```bash
curl -fsS -H "Authorization: Bearer $STATUS_CRON_SECRET" https://api.nowly.me/status/check
```

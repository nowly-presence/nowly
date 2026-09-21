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
| `INSIGHTS_URL` | No | `http://localhost:3002` |
| `DATABASE_URL` | No | - |
| `JWT_SECRET` | Yes | - |
| `DISCORD_CLIENT_ID` | Yes | - |
| `DISCORD_CLIENT_SECRET` | Yes | - |
| `BETTER_AUTH_SECRET` | Yes | - |
| `BETTER_AUTH_URL` | No | `http://localhost:3001` |
| `PRESENCE_SIGNING_PRIVATE_KEY` | Yes | - |
| `API_SECRET_KEY` | Contextual | - |
| `DEVICE_TOKEN_SECRET` | No | - |
| `OPENAI_API_KEY` | No | - |
| `DISCORD_WEBHOOK_REPORT_URL` | No | - |
| `STATUS_CRON_SECRET` | No | - |
| `STATUS_CHECK_INTERVAL_HOURS` | No | `1` |
| `STATUS_SAMPLE_LIMIT` | No | `168` |

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
| `VITE_CHROMEOS_WAITLIST_CAMPAIGN_ID` | No | - |

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

## Status check endpoint

`STATUS_CRON_SECRET` (server export, see above) protects this endpoint:

```bash
curl -fsS -H "Authorization: Bearer $STATUS_CRON_SECRET" https://api.nowly.me/status/check
```

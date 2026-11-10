import { devNull } from "node:os";

process.env.DOTENV_CONFIG_PATH = devNull;
process.env.SKIP_ENV_VALIDATION ??= "true";
process.env.FRONTEND_URL = "https://nowly.test";
process.env.ACCOUNT_URL = "https://account.nowly.test";
process.env.R2_PUBLIC_URL ??= "https://cdn.nowly.me";
process.env.BETTER_AUTH_URL ??= "http://localhost:3001";
process.env.JWT_SECRET ??= "test-jwt-secret";
process.env.ANONYMOUS_HASH_SECRET ??= "test-anonymous-hash-secret";
process.env.DISCORD_CLIENT_ID ??= "test-discord-client-id";
process.env.DISCORD_CLIENT_SECRET ??= "test-discord-client-secret";
process.env.DISCORD_REDIRECT_URI ??= "http://localhost:3001/auth/discord/callback";
process.env.PRESENCE_SIGNING_PRIVATE_KEY ??= "test-presence-signing-private-key";
process.env.STATUS_SAMPLE_LIMIT ??= "168";
process.env.STATUS_CHECK_INTERVAL_HOURS ??= "1";
process.env.NOLO_REPOSITORY ??= "nowly-presence/presences";
process.env.NOLO_BASE_BRANCH ??= "stable";
process.env.WORKERS_AI_MODEL ??= "@cf/google/gemma-4-26b-a4b-it";
import { clientEnv } from "@nowly/env/client";

export const SITE_URL = clientEnv.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "");
export const DOCS_URL = clientEnv.NEXT_PUBLIC_DOCS_BASE_URL.replace(/\/$/, "");
export const PROJECT_REPOSITORY_URL = "https://github.com/nowly-presence/nowly";
export const DISCORD_INVITE_URL = "https://discord.gg/MnZap7czgB";

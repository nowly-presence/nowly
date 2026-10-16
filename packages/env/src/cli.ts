import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const required = z.string().trim().min(1);

export const cliEnv = createEnv({
  server: {
    API_URL: z.string().trim().url().default("https://api.nowly.me"),
    API_SECRET_KEY: required.optional(),
    R2_BUCKET: required.default("nowly"),
    R2_PUBLIC_URL: z.string().trim().url().default("https://cdn.nowly.me"),
    R2_ACCESS_KEY_ID: required.optional(),
    R2_SECRET_ACCESS_KEY: required.optional(),
    R2_ACCOUNT_ID: required.optional(),
    CLOUDFLARE_API_TOKEN: required.optional(),
    CLOUDFLARE_ZONE_ID: required.optional()
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true"
});
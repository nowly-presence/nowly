import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const required = z.string().trim().min(1);

export const serverEnv = createEnv({
  server: {
    PORT: z.coerce.number().int().positive().default(3001),
    FRONTEND_URL: z.string().trim().url().default("http://localhost:3000"),
    ACCOUNT_URL: z.string().trim().url().default("http://localhost:3003"),
    DATABASE_URL: required.optional(),
    JWT_SECRET: required,
    DISCORD_CLIENT_ID: required,
    DISCORD_CLIENT_SECRET: required,
    BETTER_AUTH_SECRET: required,
    BETTER_AUTH_URL: z.string().trim().url().default("http://localhost:3001"),
    PRESENCE_SIGNING_PRIVATE_KEY: required,
    API_SECRET_KEY: required.optional(),
    DEVICE_TOKEN_SECRET: required.optional(),
    DISCORD_WEBHOOK_REPORT_URL: z.string().trim().url().optional(),
    R2_BUCKET: required.default("nowly"),
    R2_ACCOUNT_ID: required.optional(),
    R2_ACCESS_KEY_ID: required.optional(),
    R2_SECRET_ACCESS_KEY: required.optional(),
    R2_PUBLIC_URL: z.string().trim().url().default("https://cdn.nowly.me"),
    CUSTOM_ASSETS_CRON_SECRET: required.optional(),
    SMTP_HOST: required.optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(465),
    SMTP_SECURE: z
      .enum(["true", "false"])
      .default("true")
      .transform((value) => value === "true"),
    SMTP_USER: required.optional(),
    SMTP_PASSWORD: required.optional(),
    SMTP_FROM: required.default("Nowly <hello@nowly.me>"),
    CONTACT_TO: z.string().trim().email().default("hello@nowly.me"),
    STATUS_CRON_SECRET: required.optional(),
    CREATOR_WEBHOOK_SECRET: required.optional(),
    NOLO_APP_ID: required.optional(),
    NOLO_PRIVATE_KEY: required.optional(),
    NOLO_INSTALLATION_ID: required.optional(),
    NOLO_REPOSITORY: required.default("nowly-presence/presences"),
    NOLO_BASE_BRANCH: required.default("stable"),
    WORKERS_AI_ACCOUNT_ID: required.optional(),
    WORKERS_AI_API_TOKEN: required.optional(),
    WORKERS_AI_MODEL: required.default("@cf/google/gemma-4-26b-a4b-it"),
    STATUS_CHECK_INTERVAL_HOURS: z.coerce.number().int().positive().default(1),
    STATUS_SAMPLE_LIMIT: z.coerce.number().int().positive().default(168)
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: process.env.NODE_ENV === "test" || process.env.SKIP_ENV_VALIDATION === "true"
});
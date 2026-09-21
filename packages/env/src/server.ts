import "dotenv/config"
import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

const required = z.string().trim().min(1)

export const serverEnv = createEnv({
  server: {
    PORT: z.coerce.number().int().positive().default(3001),
    FRONTEND_URL: z.string().trim().url().default("http://localhost:3000"),
    INSIGHTS_URL: z.string().trim().url().default("http://localhost:3002"),
    DATABASE_URL: required.optional(),
    JWT_SECRET: required,
    DISCORD_CLIENT_ID: required,
    DISCORD_CLIENT_SECRET: required,
    BETTER_AUTH_SECRET: required,
    BETTER_AUTH_URL: z.string().trim().url().default("http://localhost:3001"),
    PRESENCE_SIGNING_PRIVATE_KEY: required,
    API_SECRET_KEY: required.optional(),
    DEVICE_TOKEN_SECRET: required.optional(),
    OPENAI_API_KEY: required.optional(),
    DISCORD_WEBHOOK_REPORT_URL: z.string().trim().url().optional(),
    AWS_ACCESS_KEY_ID: required.optional(),
    AWS_SECRET_ACCESS_KEY: required.optional(),
    AWS_REGION: required.optional(),
    AWS_SESSION_TOKEN: required.optional(),
    AWS_SES_CONFIGURATION_SET: required.optional(),
    STATUS_CRON_SECRET: required.optional(),
    STATUS_CHECK_INTERVAL_HOURS: z.coerce.number().int().positive().default(1),
    STATUS_SAMPLE_LIMIT: z.coerce.number().int().positive().default(168),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: process.env.NODE_ENV === "test" || process.env.SKIP_ENV_VALIDATION === "true",
})

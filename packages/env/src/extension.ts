import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

type ExtensionImportMetaEnv = {
  readonly VITE_WEB_BASE_URL?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_CDN_BASE_URL?: string
  readonly VITE_CHROMEOS_WAITLIST_CAMPAIGN_ID?: string
}

const metaEnv = (import.meta as ImportMeta & { env?: ExtensionImportMetaEnv }).env ?? {}
const skipValidation =
  typeof process !== "undefined"
  && (process.env.NODE_ENV === "test" || process.env.SKIP_ENV_VALIDATION === "true")

export const extensionEnv = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_WEB_BASE_URL: z.string().trim().url().default("https://nowly.me"),
    VITE_API_BASE_URL: z.string().trim().url().default("https://api.nowly.me"),
    VITE_CDN_BASE_URL: z.string().trim().url().optional(),
    VITE_CHROMEOS_WAITLIST_CAMPAIGN_ID: z.string().trim().optional(),
  },
  runtimeEnv: metaEnv,
  emptyStringAsUndefined: true,
  skipValidation,
})

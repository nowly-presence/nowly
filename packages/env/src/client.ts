import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

const booleanEnv = z.enum(["true", "false"]).default("false").transform((value) => value === "true")

export const clientEnv = createEnv({
  server: {
    PRESENCE_API_URL: z.url().trim().default("https://api.nowly.me"),
  },
  clientPrefix: "NEXT_PUBLIC_",
  client: {
    NEXT_PUBLIC_API_BASE_URL: z.url().trim().default("https://api.nowly.me"),
    NEXT_PUBLIC_BASE_URL: z.url().trim().default("https://nowly.me"),
    NEXT_PUBLIC_EXTENSION_ID: z.string().trim().min(1).default("kmnlnfldimgneaopdihplkebobckcjpf"),
    NEXT_PUBLIC_ADSENSE_ENABLED: booleanEnv,
    NEXT_PUBLIC_ADSENSE_CLIENT_ID: z.string().trim().default(""),
    NEXT_PUBLIC_ADSENSE_LANDING_SLOT: z.string().trim().default(""),
    NEXT_PUBLIC_ADSENSE_LIBRARY_SLOT: z.string().trim().default(""),
  },
  runtimeEnv: {
    PRESENCE_API_URL: process.env.PRESENCE_API_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_EXTENSION_ID: process.env.NEXT_PUBLIC_EXTENSION_ID,
    NEXT_PUBLIC_ADSENSE_ENABLED: process.env.NEXT_PUBLIC_ADSENSE_ENABLED,
    NEXT_PUBLIC_ADSENSE_CLIENT_ID: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID,
    NEXT_PUBLIC_ADSENSE_LANDING_SLOT: process.env.NEXT_PUBLIC_ADSENSE_LANDING_SLOT,
    NEXT_PUBLIC_ADSENSE_LIBRARY_SLOT: process.env.NEXT_PUBLIC_ADSENSE_LIBRARY_SLOT,
  },
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
})

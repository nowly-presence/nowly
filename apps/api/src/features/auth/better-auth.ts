import { getPrisma } from "@/db/client"
import { serverEnv } from "@nowly/env/server"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"

const createAuth = () => betterAuth({
  secret: serverEnv.BETTER_AUTH_SECRET,
  baseURL: serverEnv.BETTER_AUTH_URL,
  trustedOrigins: [serverEnv.FRONTEND_URL],
  database: prismaAdapter(getPrisma(), { provider: "postgresql" }),
  socialProviders: {
    discord: {
      clientId: serverEnv.DISCORD_CLIENT_ID,
      clientSecret: serverEnv.DISCORD_CLIENT_SECRET,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        input: false,
        defaultValue: "user",
      },
    },
  },
})

let instance: ReturnType<typeof createAuth> | undefined

// Used by require-admin.ts to gate /insights/*. Not wired into the extension
// or web app yet - no sign-in UI exists, only the API-side session check.
// Lazy singleton like `getPrisma()`: the rest of the API must keep starting
// fine without DATABASE_URL, so nothing here should run at import time.
export const getAuth = () => {
  instance ??= createAuth()
  return instance
}

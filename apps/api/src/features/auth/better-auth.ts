import { getPrisma } from "@/db/client"
import { serverEnv } from "@nowly/env/server"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"

const DEV_WEB_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]

export const authTrustedOrigins = (): string[] => [
  serverEnv.FRONTEND_URL,
  serverEnv.INSIGHTS_URL,
  ...(process.env.NODE_ENV === "production" ? [] : DEV_WEB_ORIGINS),
]

const createAuth = () => betterAuth({
  secret: serverEnv.BETTER_AUTH_SECRET,
  baseURL: serverEnv.BETTER_AUTH_URL,
  basePath: "/auth",
  trustedOrigins: authTrustedOrigins(),
  database: prismaAdapter(getPrisma(), { provider: "postgresql" }),
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: ".nowly.me",
    },
  },
  socialProviders: {
    discord: {
      clientId: serverEnv.DISCORD_CLIENT_ID,
      clientSecret: serverEnv.DISCORD_CLIENT_SECRET,
      mapProfileToUser: (profile) => ({ discordId: profile.id }),
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        input: false,
        defaultValue: "user",
      },
      discordId: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
})

let instance: ReturnType<typeof createAuth> | undefined

export const getAuth = () => {
  instance ??= createAuth()
  return instance
}

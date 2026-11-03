import { account, session, user, verification } from "@nowly/database/schema/auth";
import type { Database } from "@nowly/database/client";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

const DEV_WEB_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3003", "http://127.0.0.1:3003"];
const COOKIE_DOMAIN = ".nowly.me";
const AUTH_BASE_PATH = "/auth";

export type AuthOptions = {
  secret: string;
  baseURL: string;
  frontendUrl: string;
  accountUrl: string;
  production: boolean;
  discord: {
    clientId: string;
    clientSecret: string;
  };
};

export const authTrustedOrigins = (frontendUrl: string, accountUrl: string, production: boolean): string[] => [
  ...new Set([frontendUrl, accountUrl, ...(production ? [] : DEV_WEB_ORIGINS)])
];

export const createAuth = (db: Database, options: AuthOptions) =>
  betterAuth({
    secret: options.secret,
    baseURL: options.baseURL,
    basePath: AUTH_BASE_PATH,
    trustedOrigins: authTrustedOrigins(options.frontendUrl, options.accountUrl, options.production),
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: { user, session, account, verification }
    }),
    advanced: {
      crossSubDomainCookies: {
        enabled: true,
        domain: COOKIE_DOMAIN
      }
    },
    socialProviders: {
      discord: {
        clientId: options.discord.clientId,
        clientSecret: options.discord.clientSecret,
        overrideUserInfoOnSignIn: true,
        mapProfileToUser: (profile) => ({
          discordId: profile.id,
          discordUsername: profile.username,
          discordBanner: profile.banner ?? null
        })
      }
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          input: false,
          defaultValue: "user"
        },
        discordId: {
          type: "string",
          required: false,
          input: false
        },
        discordUsername: {
          type: "string",
          required: false,
          input: false
        },
        discordBanner: {
          type: "string",
          required: false,
          input: false
        },
        verified: {
          type: "boolean",
          input: false,
          defaultValue: false
        }
      }
    }
  });

export type Auth = ReturnType<typeof createAuth>;
import { getDb } from "@/db/client";
import { authTrustedOrigins as trustedOrigins, createAuth } from "@nowly/auth/server";
import { serverEnv } from "@nowly/env/server";

const isProduction = (): boolean => process.env.NODE_ENV === "production";

export const authTrustedOrigins = (): string[] => trustedOrigins(serverEnv.FRONTEND_URL, serverEnv.ACCOUNT_URL, isProduction());

let instance: ReturnType<typeof createAuth> | undefined;

export const getAuth = () => {
  instance ??= createAuth(getDb(), {
    secret: serverEnv.BETTER_AUTH_SECRET,
    baseURL: serverEnv.BETTER_AUTH_URL,
    frontendUrl: serverEnv.FRONTEND_URL,
    accountUrl: serverEnv.ACCOUNT_URL,
    production: isProduction(),
    discord: {
      clientId: serverEnv.DISCORD_CLIENT_ID,
      clientSecret: serverEnv.DISCORD_CLIENT_SECRET
    }
  });
  return instance;
};
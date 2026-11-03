import { hasDatabase } from "@/db/client";
import type { AppEnv } from "@/context";
import { hasAdminAuth } from "@/features/auth/auth.middleware";
import { resolveAccount } from "@/features/account/extension-token.middleware";
import { capabilitiesOf, hasCapability, type AdminCapability } from "@nowly/shared/roles";
import type { Context, MiddlewareHandler } from "hono";
import { getUserRole } from "./roles.service";

export type StaffContext = {
  role: string;
  capabilities: AdminCapability[];
};

const deny = (c: Context, status: 401 | 403 | 503, error: string) => c.json({ error }, status);

export const requireCapability =
  (capability: AdminCapability): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    if (!hasDatabase()) return deny(c, 503, "DATABASE_UNAVAILABLE");

    const account = await resolveAccount(c);

    if (!account) return deny(c, 401, "UNAUTHORIZED");
    if (account.tokenId && !account.scopes.includes("admin")) return deny(c, 403, "ADMIN_SCOPE_REQUIRED");

    const role = await getUserRole(account.userId);

    if (!hasCapability(role, capability)) return deny(c, 403, "FORBIDDEN");

    c.set("account", account);
    c.set("staff", {
      role: role ?? "user",
      capabilities: capabilitiesOf(role)
    });
    c.set("actor", {
      kind: "user",
      userId: account.userId
    });
    await next();
  };

export const requireSecretOrCapability =
  (capability: AdminCapability): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    if (hasAdminAuth(c)) {
      c.set("actor", { kind: "secret" });
      return next();
    }

    return requireCapability(capability)(c, next);
  };
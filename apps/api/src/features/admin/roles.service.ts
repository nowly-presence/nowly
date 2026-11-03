import { getDb } from "@/db/client";
import { extensionToken } from "@nowly/database/schema/account";
import { user } from "@nowly/database/schema/auth";
import type { UserRole } from "@nowly/shared/roles";
import { and, arrayContains, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { recordAdminAction, type AuditActor } from "./audit.service";

export type RoleChange = {
  found: false;
} | {
  found: true;
  changed: boolean;
  role: UserRole;
  revokedTokens: number;
};

export const getUserRole = async (userId: string): Promise<string | null> => {
  const [row] = await getDb().select({ role: user.role }).from(user).where(eq(user.id, userId)).limit(1);
  return row?.role ?? null;
};

export const findUserId = async (idOrEmail: string): Promise<string | null> => {
  const [row] = await getDb()
    .select({ id: user.id })
    .from(user)
    .where(or(eq(user.id, idOrEmail), eq(user.email, idOrEmail)))
    .limit(1);
  return row?.id ?? null;
};

export const setUserRole = async (actor: AuditActor, userId: string, role: UserRole, now = new Date()): Promise<RoleChange> =>
  getDb().transaction(async (tx) => {
    const [current] = await tx.select({ role: user.role }).from(user).where(eq(user.id, userId)).for("update");

    if (!current) return {
      found: false
    };
    if (current.role === role) return {
      found: true,
      changed: false,
      role,
      revokedTokens: 0
    };

    await tx.update(user).set({ role }).where(eq(user.id, userId));
    const revoked = await tx
      .update(extensionToken)
      .set({ revokedAt: now })
      .where(and(eq(extensionToken.userId, userId), isNull(extensionToken.revokedAt), arrayContains(extensionToken.scopes, ["admin"])))
      .returning({ id: extensionToken.id });
    await recordAdminAction(tx, actor, {
      action: "user.role.update",
      targetType: "user",
      targetId: userId,
      details: {
        from: current.role,
        to: role,
        revokedTokens: revoked.length
      }
    });
    return {
      found: true,
      changed: true,
      role,
      revokedTokens: revoked.length
    };
  });

export type AdminUserView = {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  role: string;
  verified: boolean;
};

const ADMIN_USER_SEARCH_LIMIT = 20;
const LIKE_ESCAPE = /[\\%_]/g;

export const searchAdminUsers = async (query: string): Promise<AdminUserView[]> => {
  const pattern = `%${query.replace(LIKE_ESCAPE, (character) => `\\${character}`)}%`;
  const rows = await getDb()
    .select({
      id: user.id,
      name: user.name,
      username: user.discordUsername,
      image: user.image,
      role: user.role,
      verified: user.verified
    })
    .from(user)
    .where(or(ilike(user.name, pattern), ilike(user.discordUsername, pattern), eq(user.id, query), eq(user.discordId, query)))
    .orderBy(desc(user.createdAt))
    .limit(ADMIN_USER_SEARCH_LIMIT);
  return rows;
};

export const setUserVerified = async (
  actor: AuditActor,
  userId: string,
  verified: boolean
): Promise<{
  found: boolean;
  changed: boolean;
}> =>
  getDb().transaction(async (tx) => {
    const [current] = await tx.select({ verified: user.verified }).from(user).where(eq(user.id, userId)).for("update");

    if (!current) return {
      found: false,
      changed: false
    };
    if (current.verified === verified) return {
      found: true,
      changed: false
    };

    await tx.update(user).set({ verified }).where(eq(user.id, userId));
    await recordAdminAction(tx, actor, {
      action: "user.verified.update",
      targetType: "user",
      targetId: userId,
      details: {
        from: current.verified,
        to: verified
      }
    });
    return {
      found: true,
      changed: true
    };
  });
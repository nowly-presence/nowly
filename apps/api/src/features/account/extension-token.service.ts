import { getDb } from "@/db/client";
import { sha256Base64Url } from "@/shared/crypto.service";
import { extensionToken } from "@nowly/database/schema/account";
import { EXTENSION_TOKEN_PREFIX, EXTENSION_TOKEN_SCOPES, EXTENSION_TOKEN_TTL_MS, type ExtensionTokenScope } from "@nowly/shared";
import { and, eq, isNull } from "drizzle-orm";
import { randomBytes, randomUUID } from "node:crypto";

const TOKEN_BYTES = 32;
const TOUCH_INTERVAL_MS = 60 * 60 * 1000;

export type ExtensionTokenRecord = {
  id: string;
  userId: string;
  deviceId: string | null;
  scopes: ExtensionTokenScope[];
  expiresAt: Date;
  lastUsedAt: Date | null;
};

const isScope = (value: string): value is ExtensionTokenScope => (EXTENSION_TOKEN_SCOPES as readonly string[]).includes(value);

const generateExtensionToken = (): string => `${EXTENSION_TOKEN_PREFIX}${randomBytes(TOKEN_BYTES).toString("base64url")}`;

export const createExtensionToken = async (input: {
  userId: string;
  deviceId?: string;
  scopes: ExtensionTokenScope[];
  now?: Date;
}): Promise<{
  token: string;
  expiresAt: Date;
}> => {
  const db = getDb();
  const now = input.now ?? new Date();
  const token = generateExtensionToken();
  const expiresAt = new Date(now.getTime() + EXTENSION_TOKEN_TTL_MS);

  if (input.deviceId) {
    await db
      .update(extensionToken)
      .set({ revokedAt: now })
      .where(and(eq(extensionToken.userId, input.userId), eq(extensionToken.deviceId, input.deviceId), isNull(extensionToken.revokedAt)));
  }

  await db.insert(extensionToken).values({
    id: randomUUID(),
    userId: input.userId,
    deviceId: input.deviceId ?? null,
    tokenHash: sha256Base64Url(token),
    scopes: [...new Set(input.scopes)],
    expiresAt
  });

  return { token, expiresAt };
};

export const findActiveExtensionToken = async (token: string, now = new Date()): Promise<ExtensionTokenRecord | null> => {
  if (!token.startsWith(EXTENSION_TOKEN_PREFIX)) return null;

  const [row] = await getDb()
    .select()
    .from(extensionToken)
    .where(eq(extensionToken.tokenHash, sha256Base64Url(token)))
    .limit(1);

  if (!row || row.revokedAt || row.expiresAt.getTime() <= now.getTime()) return null;

  return {
    id: row.id,
    userId: row.userId,
    deviceId: row.deviceId,
    scopes: (row.scopes ?? []).filter(isScope),
    expiresAt: row.expiresAt,
    lastUsedAt: row.lastUsedAt
  };
};

export const touchExtensionToken = async (record: ExtensionTokenRecord, now = new Date()): Promise<void> => {
  if (record.lastUsedAt && now.getTime() - record.lastUsedAt.getTime() < TOUCH_INTERVAL_MS) return;

  await getDb()
    .update(extensionToken)
    .set({
      lastUsedAt: now,
      expiresAt: new Date(now.getTime() + EXTENSION_TOKEN_TTL_MS)
    })
    .where(eq(extensionToken.id, record.id));
};

export const revokeExtensionToken = async (id: string, now = new Date()): Promise<void> => {
  await getDb()
    .update(extensionToken)
    .set({ revokedAt: now })
    .where(and(eq(extensionToken.id, id), isNull(extensionToken.revokedAt)));
};

export const revokeDeviceExtensionTokens = async (userId: string, deviceId: string, now = new Date()): Promise<void> => {
  await getDb()
    .update(extensionToken)
    .set({ revokedAt: now })
    .where(and(eq(extensionToken.userId, userId), eq(extensionToken.deviceId, deviceId), isNull(extensionToken.revokedAt)));
};

export const revokeUserExtensionTokens = async (userId: string, now = new Date()): Promise<number> => {
  const revoked = await getDb()
    .update(extensionToken)
    .set({ revokedAt: now })
    .where(and(eq(extensionToken.userId, userId), isNull(extensionToken.revokedAt)))
    .returning({ id: extensionToken.id });
  return revoked.length;
};

export const attachTokenToDevice = async (id: string, deviceId: string): Promise<void> => {
  await getDb().update(extensionToken).set({ deviceId }).where(eq(extensionToken.id, id));
};
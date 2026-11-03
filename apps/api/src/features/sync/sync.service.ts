import { getDb } from "@/db/client";
import { syncDocument } from "@nowly/database/schema/account";
import { and, asc, eq, gte } from "drizzle-orm";
import { jsonByteLength, SYNC_DOCUMENT_MAX_BYTES, type SyncDocumentKey } from "@nowly/shared";
import { syncDocumentSchemas } from "@nowly/shared/schemas";

export type SyncDocumentView = {
  key: string;
  value: unknown;
  version: number;
  updatedAt: string;
};

export type SyncValidation = {
  ok: true;
  value: unknown;
} | {
  ok: false;
  status: 400 | 413;
  error: "INVALID_SYNC_VALUE" | "SYNC_VALUE_TOO_LARGE";
};

export type SyncPutResult = {
  ok: true;
  version: number;
  updatedAt: string;
} | {
  ok: false;
  current: SyncDocumentView | null;
};

const toView = (row: { key: string; value: unknown; version: number; updatedAt: Date }): SyncDocumentView => ({
  key: row.key,
  value: row.value,
  version: row.version,
  updatedAt: row.updatedAt.toISOString()
});

export const validateSyncValue = (key: SyncDocumentKey, value: unknown): SyncValidation => {
  const parsed = syncDocumentSchemas[key].safeParse(value);

  if (!parsed.success) return {
    ok: false,
    status: 400,
    error: "INVALID_SYNC_VALUE"
  };
  if (jsonByteLength(parsed.data) > SYNC_DOCUMENT_MAX_BYTES[key]) return {
    ok: false,
    status: 413,
    error: "SYNC_VALUE_TOO_LARGE"
  };

  return {
    ok: true,
    value: parsed.data
  };
};

export const listSyncDocuments = async (userId: string, since?: Date): Promise<SyncDocumentView[]> => {
  const rows = await getDb()
    .select()
    .from(syncDocument)
    .where(and(eq(syncDocument.userId, userId), since ? gte(syncDocument.updatedAt, since) : undefined))
    .orderBy(asc(syncDocument.key));
  return rows.map(toView);
};

const getSyncDocument = async (userId: string, key: SyncDocumentKey): Promise<SyncDocumentView | null> => {
  const [row] = await getDb()
    .select()
    .from(syncDocument)
    .where(and(eq(syncDocument.userId, userId), eq(syncDocument.key, key)))
    .limit(1);
  return row ? toView(row) : null;
};

export const putSyncDocument = async (input: {
  userId: string;
  key: SyncDocumentKey;
  value: unknown;
  baseVersion: number;
  deviceId: string | null;
  now?: Date;
}): Promise<SyncPutResult> => {
  const db = getDb();
  const updatedAt = input.now ?? new Date();
  const version = input.baseVersion + 1;
  const written =
    input.baseVersion === 0
      ? await db
          .insert(syncDocument)
          .values({
            userId: input.userId,
            key: input.key,
            value: input.value,
            version,
            updatedAt,
            updatedByDeviceId: input.deviceId
          })
          .onConflictDoNothing()
          .returning({ version: syncDocument.version })
      : await db
          .update(syncDocument)
          .set({
            value: input.value,
            version,
            updatedAt,
            updatedByDeviceId: input.deviceId
          })
          .where(and(eq(syncDocument.userId, input.userId), eq(syncDocument.key, input.key), eq(syncDocument.version, input.baseVersion)))
          .returning({ version: syncDocument.version });

  if (written.length === 1) return {
    ok: true,
    version,
    updatedAt: updatedAt.toISOString()
  };

  return {
    ok: false,
    current: await getSyncDocument(input.userId, input.key)
  };
};

export const deleteSyncDocuments = async (userId: string): Promise<number> => {
  const deleted = await getDb().delete(syncDocument).where(eq(syncDocument.userId, userId)).returning({ key: syncDocument.key });
  return deleted.length;
};
import { getDb } from "@/db/client";
import { creatorDraft } from "@nowly/database/schema/creator";
import { jsonByteLength } from "@nowly/shared";
import { and, eq } from "drizzle-orm";
import { CREATOR_DRAFT_MAX_BYTES, CREATOR_DRAFTS_MAX } from "./creator-drafts.schemas";

export type DraftIndexEntry = {
  id: string;
  updatedAt: number;
  deleted: boolean;
};

export type DraftPutResult = {
  ok: true;
  updatedAt: number;
} | {
  ok: false;
  error: "DRAFT_TOO_LARGE" | "TOO_MANY_DRAFTS" | "DRAFT_ID_MISMATCH";
} | {
  ok: false;
  error: "DRAFT_CONFLICT";
  updatedAt: number;
};

export const listDraftIndex = async (userId: string): Promise<DraftIndexEntry[]> => {
  const rows = await getDb()
    .select({
      id: creatorDraft.draftId,
      updatedAt: creatorDraft.draftUpdatedAt,
      deleted: creatorDraft.deleted
    })
    .from(creatorDraft)
    .where(eq(creatorDraft.userId, userId));
  return rows;
};

export const getDraft = async (userId: string, draftId: string) => {
  const [row] = await getDb()
    .select({
      value: creatorDraft.value,
      updatedAt: creatorDraft.draftUpdatedAt,
      deleted: creatorDraft.deleted
    })
    .from(creatorDraft)
    .where(and(eq(creatorDraft.userId, userId), eq(creatorDraft.draftId, draftId)))
    .limit(1);
  return row && !row.deleted ? row : null;
};

export const putDraft = async (input: { userId: string; draftId: string; updatedAt: number; value: { id: string } }): Promise<DraftPutResult> => {
  if (input.value.id !== input.draftId) return {
    ok: false,
    error: "DRAFT_ID_MISMATCH"
  };
  if (jsonByteLength(input.value) > CREATOR_DRAFT_MAX_BYTES) return {
    ok: false,
    error: "DRAFT_TOO_LARGE"
  };

  const index = await listDraftIndex(input.userId);
  const existing = index.find((entry) => entry.id === input.draftId);

  if (existing && existing.updatedAt > input.updatedAt) return {
    ok: false,
    error: "DRAFT_CONFLICT",
    updatedAt: existing.updatedAt
  };
  if (!existing && index.filter((entry) => !entry.deleted).length >= CREATOR_DRAFTS_MAX) return {
    ok: false,
    error: "TOO_MANY_DRAFTS"
  };

  await getDb()
    .insert(creatorDraft)
    .values({
      userId: input.userId,
      draftId: input.draftId,
      value: input.value,
      draftUpdatedAt: input.updatedAt,
      deleted: false
    })
    .onConflictDoUpdate({
      target: [creatorDraft.userId, creatorDraft.draftId],
      set: {
        value: input.value,
        draftUpdatedAt: input.updatedAt,
        deleted: false,
        updatedAt: new Date()
      }
    });
  return {
    ok: true,
    updatedAt: input.updatedAt
  };
};

export const deleteDraft = async (userId: string, draftId: string): Promise<number> => {
  const deletedAt = Date.now();
  await getDb()
    .insert(creatorDraft)
    .values({
      userId,
      draftId,
      value: null,
      draftUpdatedAt: deletedAt,
      deleted: true
    })
    .onConflictDoUpdate({
      target: [creatorDraft.userId, creatorDraft.draftId],
      set: {
        value: null,
        draftUpdatedAt: deletedAt,
        deleted: true,
        updatedAt: new Date()
      }
    });
  return deletedAt;
};

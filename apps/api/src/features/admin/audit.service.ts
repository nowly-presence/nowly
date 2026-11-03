import { getDb } from "@/db/client";
import type { Executor } from "@nowly/database/client";
import { adminAuditEvent } from "@nowly/database/schema/admin";
import { desc, eq, lt } from "drizzle-orm";
import { randomUUID } from "node:crypto";

export type AuditActor = {
  kind: "user";
  userId: string;
} | {
  kind: "secret";
} | {
  kind: "cli";
};

export type AuditAction =
  "announcement.create" | "user.role.update" | "user.verified.update" | "submission.review" | "submission.publish" | "submission.published";

export type AuditEntry = {
  action: AuditAction;
  targetType: "announcement" | "user" | "submission";
  targetId: string | null;
  details?: Record<string, unknown>;
};

export type AuditEventView = {
  id: string;
  actorId: string | null;
  actorKind: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: unknown;
  createdAt: string;
};

export const AUDIT_PAGE_SIZE = 50;

export const recordAdminAction = async (executor: Executor, actor: AuditActor, entry: AuditEntry): Promise<void> => {
  await executor.insert(adminAuditEvent).values({
    id: randomUUID(),
    actorId: actor.kind === "user" ? actor.userId : null,
    actorKind: actor.kind,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    details: entry.details ?? {}
  });
};

const toView = (row: typeof adminAuditEvent.$inferSelect): AuditEventView => ({
  id: row.id,
  actorId: row.actorId,
  actorKind: row.actorKind,
  action: row.action,
  targetType: row.targetType,
  targetId: row.targetId,
  details: row.details,
  createdAt: row.createdAt.toISOString()
});

export const listAdminActions = async (before?: Date): Promise<AuditEventView[]> => {
  const rows = await getDb()
    .select()
    .from(adminAuditEvent)
    .where(before ? lt(adminAuditEvent.createdAt, before) : undefined)
    .orderBy(desc(adminAuditEvent.createdAt), desc(adminAuditEvent.id))
    .limit(AUDIT_PAGE_SIZE);
  return rows.map(toView);
};

export const listActorActions = async (userId: string): Promise<AuditEventView[]> => {
  const rows = await getDb().select().from(adminAuditEvent).where(eq(adminAuditEvent.actorId, userId)).orderBy(desc(adminAuditEvent.createdAt));
  return rows.map(toView);
};
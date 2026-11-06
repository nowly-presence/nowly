import { getDb } from "@/db/client";
import type { Executor } from "@nowly/database/client";
import { adminAuditEvent } from "@nowly/database/schema/admin";
import { user } from "@nowly/database/schema/auth";
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
  | "announcement.create"
  | "announcement.update"
  | "announcement.delete"
  | "user.role.update"
  | "user.verified.update"
  | "submission.review"
  | "submission.publish"
  | "submission.published"
  | "presence.hide"
  | "presence.show"
  | "presence.delete"
  | "report.reply"
  | "report.note"
  | "report.status"
  | "report.assign"
  | "report.delete";

export type AuditEntry = {
  action: AuditAction;
  targetType: "announcement" | "user" | "submission" | "presence" | "report";
  targetId: string | null;
  details?: Record<string, unknown>;
};

export type AuditEventView = {
  id: string;
  actorId: string | null;
  actorKind: string;
  actorName: string | null;
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

const toView = (row: typeof adminAuditEvent.$inferSelect, actorName: string | null = null): AuditEventView => ({
  id: row.id,
  actorId: row.actorId,
  actorKind: row.actorKind,
  actorName,
  action: row.action,
  targetType: row.targetType,
  targetId: row.targetId,
  details: row.details,
  createdAt: row.createdAt.toISOString()
});

export const listAdminActions = async (before?: Date): Promise<AuditEventView[]> => {
  const rows = await getDb()
    .select({
      event: adminAuditEvent,
      actorName: user.name
    })
    .from(adminAuditEvent)
    .leftJoin(user, eq(user.id, adminAuditEvent.actorId))
    .where(before ? lt(adminAuditEvent.createdAt, before) : undefined)
    .orderBy(desc(adminAuditEvent.createdAt), desc(adminAuditEvent.id))
    .limit(AUDIT_PAGE_SIZE);
  return rows.map((row) => toView(row.event, row.actorName));
};

export const listActorActions = async (userId: string): Promise<AuditEventView[]> => {
  const rows = await getDb().select().from(adminAuditEvent).where(eq(adminAuditEvent.actorId, userId)).orderBy(desc(adminAuditEvent.createdAt));
  return rows.map((row) => toView(row));
};
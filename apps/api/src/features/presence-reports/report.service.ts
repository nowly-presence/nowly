import { getDb } from "@/db/client";
import { type AuditActor, recordAdminAction } from "@/features/admin/audit.service";
import type { Executor } from "@nowly/database/client";
import { user } from "@nowly/database/schema/auth";
import { presenceReport, presenceReportMessage } from "@nowly/database/schema/report";
import { and, asc, desc, eq, gt, inArray, lt, ne, or, sql } from "drizzle-orm";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { REPORT_AUTO_CLOSE_DAYS, REPORT_MESSAGES_PER_THREAD, REPORT_OPEN_PER_KEY, REPORT_PAGE_SIZE, REPORT_REOPEN_WINDOW_DAYS, type ReportStatus } from "./report.constants";
import { removeReportAttachments } from "./report-attachments";
import { ReportError } from "./report-errors";
import { reporterLabelOf, toMessageView, type MessageAuthor, type ReportMessageView, type ReportRow, type ReportSummaryView, type StaffReportSummaryView } from "./report.views";

const DAY_MS = 86_400_000;
const OPEN_STATUSES: ReportStatus[] = ["new", "in_progress", "info_requested"];

export type Reporter = {
  keyHash: string;
  userId: string | null;
};

export const hashReporterKey = (key: string): string => createHash("sha256").update(key).digest("hex");

const sameHash = (left: string, right: string): boolean => left.length === right.length && timingSafeEqual(Buffer.from(left), Buffer.from(right));

const ownedBy = (report: ReportRow, reporter: Reporter): boolean =>
  sameHash(report.secretHash, reporter.keyHash) || (reporter.userId !== null && report.reporterId === reporter.userId);

const ownership = (reporter: Reporter) =>
  reporter.userId
    ? or(eq(presenceReport.secretHash, reporter.keyHash), eq(presenceReport.reporterId, reporter.userId))
    : eq(presenceReport.secretHash, reporter.keyHash);

const lastMessageOf = async (executor: Executor, reportIds: string[]): Promise<
  Map<
    string,
    {
      authorRole: string;
      body: string;
    }
  >
> => {
  const result = new Map<
    string,
    {
      authorRole: string;
      body: string;
    }
  >();

  if (reportIds.length === 0) return result;

  const rows = await executor
    .select({
      reportId: presenceReportMessage.reportId,
      authorRole: presenceReportMessage.authorRole,
      body: presenceReportMessage.body,
      kind: presenceReportMessage.kind
    })
    .from(presenceReportMessage)
    .where(
      and(inArray(presenceReportMessage.reportId, reportIds), eq(presenceReportMessage.visibility, "public"), ne(presenceReportMessage.kind, "status_change"))
    )
    .orderBy(desc(presenceReportMessage.createdAt));

  for (const row of rows)
    if (!result.has(row.reportId)) result.set(row.reportId, {
      authorRole: row.authorRole,
      body: row.body
    });

  return result;
};

const summaryOf = (
  report: ReportRow,
  lastMessage: {
    authorRole: string;
    body: string;
  } | null
): ReportSummaryView => ({
  id: report.id,
  slug: report.slug,
  status: report.status as ReportStatus,
  notify: report.notify,
  lastMessageAt: report.lastMessageAt.toISOString(),
  createdAt: report.createdAt.toISOString(),
  resolvedAt: report.resolvedAt?.toISOString() ?? null,
  unread: report.reporterReadAt === null || report.reporterReadAt < report.lastMessageAt,
  lastMessage
});

const authorsOf = async (executor: Executor, ids: string[]): Promise<Map<string, MessageAuthor>> => {
  const result = new Map<string, MessageAuthor>();

  if (ids.length === 0) return result;

  const rows = await executor
    .select({
      id: user.id,
      name: user.name,
      image: user.image,
      role: user.role
    })
    .from(user)
    .where(inArray(user.id, ids));

  for (const row of rows)
    result.set(row.id, {
      name: row.name,
      avatar: row.image,
      role: row.role
    });

  return result;
};

const loadMessages = async (executor: Executor, report: ReportRow, audience: "reporter" | "staff"): Promise<ReportMessageView[]> => {
  const rows = await executor
    .select()
    .from(presenceReportMessage)
    .where(and(eq(presenceReportMessage.reportId, report.id), audience === "reporter" ? eq(presenceReportMessage.visibility, "public") : undefined))
    .orderBy(asc(presenceReportMessage.createdAt), asc(presenceReportMessage.id));

  const authors = await authorsOf(executor, [...new Set(rows.flatMap((row) => (row.authorId ? [row.authorId] : [])))]);

  return rows.map((row) =>
    toMessageView(
      row,
      report,
      (row.authorId ? authors.get(row.authorId) : undefined) ?? {
        name: null,
        avatar: null,
        role: null
      },
      audience
    )
  );
};

const countMessages = async (executor: Executor, reportId: string): Promise<number> => {
  const [row] = await executor
    .select({ total: sql<number>`count(*)::int` })
    .from(presenceReportMessage)
    .where(eq(presenceReportMessage.reportId, reportId));
  return row?.total ?? 0;
};

const lockReport = async (executor: Executor, id: string): Promise<ReportRow | null> => {
  const [row] = await executor.select().from(presenceReport).where(eq(presenceReport.id, id)).for("update");
  return row ?? null;
};

const autoCloseFor = (status: ReportStatus, now: Date): Date | null =>
  status === "info_requested" ? new Date(now.getTime() + REPORT_AUTO_CLOSE_DAYS * DAY_MS) : null;

const statusMarker = (
  executor: Executor,
  reportId: string,
  actorId: string | null,
  role: "staff" | "reporter" | "system",
  from: ReportStatus,
  to: ReportStatus
) =>
  executor.insert(presenceReportMessage).values({
    id: randomUUID(),
    reportId,
    authorId: actorId,
    authorRole: role,
    kind: "status_change",
    visibility: "public",
    body: from,
    statusTo: to
  });

export type CreateReportInput = {
  reporter: Reporter;
  slug: string;
  message: string;
  anonymous: boolean;
  label: string | null;
  labelSource: "discord_link" | "native_host" | null;
  notify: boolean;
  context: Record<string, string>;
};

export const createReport = async (input: CreateReportInput): Promise<ReportSummaryView> =>
  getDb().transaction(async (tx) => {
    const [open] = await tx
      .select({ total: sql<number>`count(*)::int` })
      .from(presenceReport)
      .where(and(ownership(input.reporter), inArray(presenceReport.status, OPEN_STATUSES)));

    if ((open?.total ?? 0) >= REPORT_OPEN_PER_KEY) throw new ReportError("REPORT_LIMIT");

    const id = `rep_${randomUUID()}`;
    const now = new Date();
    const hasLabel = !input.anonymous && input.label !== null;
    const [report] = await tx
      .insert(presenceReport)
      .values({
        id,
        slug: input.slug,
        reporterId: input.reporter.userId,
        secretHash: input.reporter.keyHash,
        anonymous: input.anonymous,
        reporterLabel: hasLabel ? input.label : null,
        reporterSource: hasLabel ? (input.labelSource ?? "none") : "none",
        status: "new",
        context: input.context,
        notify: input.notify,
        lastMessageAt: now,
        reporterReadAt: now
      })
      .returning();

    if (!report) throw new Error("report insert failed");

    await tx.insert(presenceReportMessage).values({
      id: randomUUID(),
      reportId: id,
      authorId: input.reporter.userId,
      authorRole: "reporter",
      kind: "message",
      visibility: "public",
      body: input.message
    });
    return summaryOf(report, {
      authorRole: "reporter",
      body: input.message
    });
  });

export const listReporterReports = async (reporter: Reporter): Promise<ReportSummaryView[]> => {
  const db = getDb();
  const rows = await db.select().from(presenceReport).where(ownership(reporter)).orderBy(desc(presenceReport.lastMessageAt)).limit(REPORT_PAGE_SIZE);

  const last = await lastMessageOf(
    db,
    rows.map((row) => row.id)
  );
  return rows.map((row) => summaryOf(row, last.get(row.id) ?? null));
};

export const reporterUpdates = async (reporter: Reporter, since: Date | undefined): Promise<ReportSummaryView[]> => {
  const db = getDb();
  const rows = await db
    .select()
    .from(presenceReport)
    .where(and(ownership(reporter), since ? gt(presenceReport.lastMessageAt, since) : undefined))
    .orderBy(desc(presenceReport.lastMessageAt))
    .limit(REPORT_PAGE_SIZE);

  const last = await lastMessageOf(
    db,
    rows.map((row) => row.id)
  );
  return rows.map((row) => summaryOf(row, last.get(row.id) ?? null));
};

export const getReporterReport = async (
  reporter: Reporter,
  id: string
): Promise<{
  report: ReportSummaryView;
  messages: ReportMessageView[];
}> =>
  getDb().transaction(async (tx) => {
    const report = await lockReport(tx, id);

    if (!report || !ownedBy(report, reporter)) throw new ReportError("REPORT_NOT_FOUND");

    const messages = await loadMessages(tx, report, "reporter");

    const readAt = new Date();
    await tx.update(presenceReport).set({ reporterReadAt: readAt }).where(eq(presenceReport.id, id));
    return {
      report: summaryOf(
        {
          ...report,
          reporterReadAt: readAt
        },
        null
      ),
      messages
    };
  });

export const postReporterMessage = async (
  reporter: Reporter,
  id: string,
  input: {
    message: string;
    answerTo?: string;
    attachments?: string[];
  }
): Promise<ReportMessageView[]> =>
  getDb().transaction(async (tx) => {
    const report = await lockReport(tx, id);

    if (!report || !ownedBy(report, reporter)) throw new ReportError("REPORT_NOT_FOUND");

    const now = new Date();
    const status = report.status as ReportStatus;

    if (status === "closed") throw new ReportError("REPORT_CLOSED");
    if (status === "fixed" && report.resolvedAt && now.getTime() - report.resolvedAt.getTime() > REPORT_REOPEN_WINDOW_DAYS * DAY_MS) throw new ReportError(
      "REPORT_CLOSED"
    );
    if ((await countMessages(tx, id)) >= REPORT_MESSAGES_PER_THREAD) throw new ReportError("THREAD_FULL");

    if (input.answerTo) {
      const [target] = await tx
        .select({ id: presenceReportMessage.id })
        .from(presenceReportMessage)
        .where(
          and(
            eq(presenceReportMessage.id, input.answerTo),
            eq(presenceReportMessage.reportId, id),
            eq(presenceReportMessage.kind, "info_request"),
            eq(presenceReportMessage.visibility, "public")
          )
        );

      if (!target) throw new ReportError("INVALID_ANSWER");
    }

    await tx.insert(presenceReportMessage).values({
      id: randomUUID(),
      reportId: id,
      authorId: reporter.userId,
      authorRole: "reporter",
      kind: "message",
      visibility: "public",
      body: input.message,
      answerTo: input.answerTo ?? null,
      attachments: input.attachments ?? []
    });

    const next: ReportStatus = status === "info_requested" || status === "fixed" ? "in_progress" : status;

    if (next !== status) await statusMarker(tx, id, reporter.userId, "reporter", status, next);

    await tx
      .update(presenceReport)
      .set({
        status: next,
        lastMessageAt: now,
        reporterReadAt: now,
        autoCloseAt: autoCloseFor(next, now),
        resolvedAt: next === status ? report.resolvedAt : null
      })
      .where(eq(presenceReport.id, id));
    return loadMessages(
      tx,
      {
        ...report,
        status: next
      },
      "reporter"
    );
  });

export const setReporterClosed = async (reporter: Reporter, id: string, closed: boolean): Promise<ReportSummaryView> =>
  getDb().transaction(async (tx) => {
    const report = await lockReport(tx, id);

    if (!report || !ownedBy(report, reporter)) throw new ReportError("REPORT_NOT_FOUND");

    const status = report.status as ReportStatus;
    const now = new Date();

    if (closed && status === "closed") return summaryOf(report, null);

    if (!closed && status !== "closed" && status !== "fixed") return summaryOf(report, null);

    if (!closed && report.resolvedAt && now.getTime() - report.resolvedAt.getTime() > REPORT_REOPEN_WINDOW_DAYS * DAY_MS) throw new ReportError(
      "REPORT_CLOSED"
    );

    const next: ReportStatus = closed ? "closed" : "in_progress";
    await statusMarker(tx, id, reporter.userId, "reporter", status, next);
    const [updated] = await tx
      .update(presenceReport)
      .set({
        status: next,
        lastMessageAt: now,
        autoCloseAt: null,
        resolvedAt: closed ? now : null
      })
      .where(eq(presenceReport.id, id))
      .returning();
    return summaryOf(updated ?? report, null);
  });

export const setReporterNotify = async (reporter: Reporter, id: string, notify: boolean): Promise<void> => {
  const db = getDb();
  const [report] = await db.select().from(presenceReport).where(eq(presenceReport.id, id));

  if (!report || !ownedBy(report, reporter)) throw new ReportError("REPORT_NOT_FOUND");

  await db.update(presenceReport).set({ notify }).where(eq(presenceReport.id, id));
};

export type StaffMessageInput = {
  message: string;
  visibility: "public" | "internal";
  statusTo?: ReportStatus;
  choices?: string[];
  attachments?: string[];
};

export const listStaffReports = async (filter: {
  status?: ReportStatus;
  assigneeId?: string;
  before?: Date;
}): Promise<StaffReportSummaryView[]> => {
  const db = getDb();
  const rows = await db
    .select()
    .from(presenceReport)
    .where(
      and(
        filter.status ? eq(presenceReport.status, filter.status) : undefined,
        filter.assigneeId ? eq(presenceReport.assigneeId, filter.assigneeId) : undefined,
        filter.before ? lt(presenceReport.lastMessageAt, filter.before) : undefined
      )
    )
    .orderBy(desc(presenceReport.lastMessageAt))
    .limit(REPORT_PAGE_SIZE);

  const last = await lastMessageOf(
    db,
    rows.map((row) => row.id)
  );
  return rows.map((row) => {
    const summary = summaryOf(row, last.get(row.id) ?? null);
    return {
      id: summary.id,
      slug: summary.slug,
      status: summary.status,
      lastMessageAt: summary.lastMessageAt,
      createdAt: summary.createdAt,
      resolvedAt: summary.resolvedAt,
      lastMessage: summary.lastMessage,
      reporterLabel: reporterLabelOf(row),
      assigneeId: row.assigneeId,
      unread: row.staffReadAt === null || row.staffReadAt < row.lastMessageAt
    };
  });
};

export const countStaffReports = async (): Promise<{
  new: number;
  awaitingReporter: number;
}> => {
  const rows = await getDb()
    .select({
      status: presenceReport.status,
      total: sql<number>`count(*)::int`
    })
    .from(presenceReport)
    .where(inArray(presenceReport.status, ["new", "in_progress", "info_requested"]))
    .groupBy(presenceReport.status);

  const count = (status: string) => rows.find((row) => row.status === status)?.total ?? 0;
  return {
    new: count("new") + count("in_progress"),
    awaitingReporter: count("info_requested")
  };
};

export const getStaffReport = async (id: string) =>
  getDb().transaction(async (tx) => {
    const report = await lockReport(tx, id);

    if (!report) throw new ReportError("REPORT_NOT_FOUND");

    const messages = await loadMessages(tx, report, "staff");
    await tx.update(presenceReport).set({ staffReadAt: new Date() }).where(eq(presenceReport.id, id));
    return {
      id: report.id,
      slug: report.slug,
      status: report.status as ReportStatus,
      reporterLabel: reporterLabelOf(report),
      anonymous: report.anonymous,
      assigneeId: report.assigneeId,
      context: report.context,
      createdAt: report.createdAt.toISOString(),
      messages
    };
  });

export const postStaffMessage = async (
  actor: AuditActor & {
    kind: "user";
  },
  id: string,
  input: StaffMessageInput
): Promise<ReportMessageView[]> =>
  getDb().transaction(async (tx) => {
    const report = await lockReport(tx, id);

    if (!report) throw new ReportError("REPORT_NOT_FOUND");

    if ((await countMessages(tx, id)) >= REPORT_MESSAGES_PER_THREAD) throw new ReportError("THREAD_FULL");

    const now = new Date();
    const current = report.status as ReportStatus;
    const internal = input.visibility === "internal";
    const target: ReportStatus = input.statusTo ?? (input.choices ? "info_requested" : current === "new" ? "in_progress" : current);

    if (!internal && current === "closed" && target === "closed") throw new ReportError("REPORT_CLOSED");

    if (input.message.length > 0 || internal || (input.attachments?.length ?? 0) > 0) await tx.insert(presenceReportMessage).values({
      id: randomUUID(),
      reportId: id,
      authorId: actor.userId,
      authorRole: "staff",
      kind: internal ? "note" : input.choices ? "info_request" : "message",
      visibility: input.visibility,
      body: input.message,
      choices: input.choices ?? null,
      attachments: input.attachments ?? []
    });

    if (!internal && target !== current) await statusMarker(tx, id, actor.userId, "staff", current, target);

    await tx
      .update(presenceReport)
      .set(
        internal
          ? { staffReadAt: now }
          : {
              status: target,
              lastMessageAt: now,
              staffReadAt: now,
              autoCloseAt: autoCloseFor(target, now),
              resolvedAt: target === "fixed" || target === "closed" ? now : null,
              assigneeId: report.assigneeId ?? actor.userId
            }
      )
      .where(eq(presenceReport.id, id));
    await recordAdminAction(tx, actor, {
      action: internal ? "report.note" : target !== current ? "report.status" : "report.reply",
      targetType: "report",
      targetId: id,
      details: target !== current && !internal ? { from: current, to: target } : {}
    });
    return loadMessages(
      tx,
      {
        ...report,
        status: target
      },
      "staff"
    );
  });

export const setStaffAssignee = async (actor: AuditActor, id: string, assigneeId: string | null): Promise<void> =>
  getDb().transaction(async (tx) => {
    const report = await lockReport(tx, id);

    if (!report) throw new ReportError("REPORT_NOT_FOUND");

    await tx.update(presenceReport).set({ assigneeId }).where(eq(presenceReport.id, id));
    await recordAdminAction(tx, actor, {
      action: "report.assign",
      targetType: "report",
      targetId: id,
      details: { assigneeId }
    });
  });

export const assertReporterOwns = async (reporter: Reporter, id: string): Promise<void> => {
  const [report] = await getDb().select().from(presenceReport).where(eq(presenceReport.id, id));

  if (!report || !ownedBy(report, reporter)) throw new ReportError("REPORT_NOT_FOUND");
};

export const deleteReport = async (actor: AuditActor, id: string): Promise<void> => {
  const keys = await getDb().transaction(async (tx) => {
    const messages = await tx
      .select({ attachments: presenceReportMessage.attachments })
      .from(presenceReportMessage)
      .where(eq(presenceReportMessage.reportId, id));

    const removed = await tx.delete(presenceReport).where(eq(presenceReport.id, id)).returning({ id: presenceReport.id });

    if (removed.length === 0) throw new ReportError("REPORT_NOT_FOUND");

    await recordAdminAction(tx, actor, {
      action: "report.delete",
      targetType: "report",
      targetId: id
    });
    return messages.flatMap((message) =>
      Array.isArray(message.attachments) ? message.attachments.filter((key): key is string => typeof key === "string") : []
    );
  });

  await removeReportAttachments(keys).catch(() => undefined);
};

export const closeStaleReports = async (now: Date = new Date()): Promise<number> =>
  getDb().transaction(async (tx) => {
    const stale = await tx
      .select()
      .from(presenceReport)
      .where(and(eq(presenceReport.status, "info_requested"), lt(presenceReport.autoCloseAt, now)))
      .for("update");

    for (const report of stale) {
      await statusMarker(tx, report.id, null, "system", "info_requested", "closed");
      await tx
        .update(presenceReport)
        .set({
          status: "closed",
          lastMessageAt: now,
          resolvedAt: now,
          autoCloseAt: null
        })
        .where(eq(presenceReport.id, report.id));
    }

    return stale.length;
  });

export type ExportedReport = {
  id: string;
  slug: string;
  status: ReportStatus;
  anonymous: boolean;
  createdAt: string;
  messages: Array<{
    from: "you" | "team";
    kind: string;
    body: string;
    attachments: string[];
    createdAt: string;
  }>;
};

export const exportReporterReports = async (userId: string): Promise<ExportedReport[]> => {
  const db = getDb();
  const reports = await db.select().from(presenceReport).where(eq(presenceReport.reporterId, userId)).orderBy(asc(presenceReport.createdAt));

  const exported: ExportedReport[] = [];

  for (const report of reports) {
    const messages = await loadMessages(db, report, "reporter");
    exported.push({
      id: report.id,
      slug: report.slug,
      status: report.status as ReportStatus,
      anonymous: report.anonymous,
      createdAt: report.createdAt.toISOString(),
      messages: messages.map((message) => ({
        from: message.authorRole === "staff" ? "team" : "you",
        kind: message.kind,
        body: message.body,
        attachments: message.attachments,
        createdAt: message.createdAt
      }))
    });
  }

  return exported;
};

export const eraseReporterReports = async (userId: string): Promise<void> => {
  const db = getDb();
  const owned = await db.select({ id: presenceReport.id }).from(presenceReport).where(eq(presenceReport.reporterId, userId));

  if (owned.length === 0) return;

  const ids = owned.map((report) => report.id);

  const messages = await db
    .select({ attachments: presenceReportMessage.attachments })
    .from(presenceReportMessage)
    .where(inArray(presenceReportMessage.reportId, ids));
  await removeReportAttachments(
    messages.flatMap((message) => (Array.isArray(message.attachments) ? message.attachments.filter((key): key is string => typeof key === "string") : []))
  ).catch(() => undefined);
  await db.delete(presenceReport).where(inArray(presenceReport.id, ids));
};
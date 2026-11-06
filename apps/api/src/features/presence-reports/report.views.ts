import { presenceReport, presenceReportMessage } from "@nowly/database/schema/report";
import { attachmentUrls } from "./report-attachments";
import { REPORT_ANONYMOUS_LABEL, type ReportStatus } from "./report.constants";

export type ReportMessageView = {
  id: string;
  authorRole: "reporter" | "staff" | "system";
  authorName: string | null;
  authorAvatar: string | null;
  authorStaffRole: string | null;
  kind: string;
  visibility: string;
  body: string;
  choices: string[] | null;
  answerTo: string | null;
  statusTo: string | null;
  attachments: string[];
  createdAt: string;
};

export type ReportSummaryView = {
  id: string;
  slug: string;
  status: ReportStatus;
  notify: boolean;
  lastMessageAt: string;
  createdAt: string;
  resolvedAt: string | null;
  unread: boolean;
  lastMessage: {
    authorRole: string;
    body: string;
  } | null;
};

export type StaffReportSummaryView = Omit<ReportSummaryView, "notify" | "unread"> & {
  reporterLabel: string;
  assigneeId: string | null;
  unread: boolean;
};

export type ReportRow = typeof presenceReport.$inferSelect;
export type ReportMessageRow = typeof presenceReportMessage.$inferSelect;

export type MessageAuthor = {
  name: string | null;
  avatar: string | null;
  role: string | null;
};

const stringChoices = (value: unknown): string[] | null => (Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : null);

export const reporterLabelOf = (report: ReportRow): string => (report.anonymous ? REPORT_ANONYMOUS_LABEL : (report.reporterLabel ?? REPORT_ANONYMOUS_LABEL));

export const toMessageView = (row: ReportMessageRow, report: ReportRow, author: MessageAuthor, audience: "reporter" | "staff"): ReportMessageView => ({
  id: row.id,
  authorRole: row.authorRole === "staff" ? "staff" : row.authorRole === "system" ? "system" : "reporter",
  authorName: row.authorRole === "staff" ? author.name : row.authorRole === "reporter" ? (audience === "staff" ? reporterLabelOf(report) : null) : null,
  authorAvatar: row.authorRole === "staff" ? author.avatar : null,
  authorStaffRole: row.authorRole === "staff" ? author.role : null,
  kind: row.kind,
  visibility: row.visibility,
  body: row.body,
  choices: stringChoices(row.choices),
  answerTo: row.answerTo,
  statusTo: row.statusTo,
  attachments: attachmentUrls(row.attachments),
  createdAt: row.createdAt.toISOString()
});
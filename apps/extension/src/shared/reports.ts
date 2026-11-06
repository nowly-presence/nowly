export const REPORT_STATUSES = ["new", "in_progress", "info_requested", "fixed", "closed"] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_MESSAGE_MAX_LENGTH = 2000;
export const REPORTER_KEY_HEADER = "x-reporter-key";
export const REPORTER_KEY_BYTES = 32;
export const REPORT_POLL_MS = 30_000;

export type ReportMessageKind = "message" | "info_request" | "status_change" | "note";

export type ReportMessage = {
  id: string;
  authorRole: "reporter" | "staff" | "system";
  authorName: string | null;
  authorAvatar: string | null;
  authorStaffRole: string | null;
  kind: ReportMessageKind;
  visibility: "public" | "internal";
  body: string;
  choices: string[] | null;
  answerTo: string | null;
  statusTo: ReportStatus | null;
  createdAt: string;
};

export type ReportSummary = {
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

export type StaffReportSummary = {
  id: string;
  slug: string;
  status: ReportStatus;
  reporterLabel: string;
  assigneeId: string | null;
  lastMessageAt: string;
  createdAt: string;
  resolvedAt: string | null;
  unread: boolean;
  lastMessage: {
    authorRole: string;
    body: string;
  } | null;
};

export type StaffReportDetail = {
  id: string;
  slug: string;
  status: ReportStatus;
  reporterLabel: string;
  anonymous: boolean;
  assigneeId: string | null;
  createdAt: string;
  messages: ReportMessage[];
};

export type StaffReportCounts = {
  new: number;
  awaitingReporter: number;
};

export type StaffReportFilter = "todo" | "waiting" | "mine" | "all";

export const REPORT_CHOICES_MIN = 2;
export const REPORT_CHOICES_MAX = 6;

export type ReportResult<T extends object = object> =
  | ({
      ok: true;
    } & T)
  | {
      ok: false;
      error: string;
    };

export const isReportStatus = (value: unknown): value is ReportStatus => typeof value === "string" && (REPORT_STATUSES as readonly string[]).includes(value);

export const isReportOpen = (status: ReportStatus): boolean => status !== "closed";
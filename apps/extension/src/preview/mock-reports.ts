import type { MockHandlers } from "@/preview/mock-router";
import type { ReportMessage, ReportStatus, ReportSummary, StaffReportDetail, StaffReportSummary } from "@/shared/reports";

const HOUR_MS = 3_600_000;
const REPORT_ID = "rep_preview";
const STAFF_ID = "preview-staff";

const at = (hoursAgo: number): string => new Date(Date.now() - hoursAgo * HOUR_MS).toISOString();

const message = (overrides: Partial<ReportMessage> & Pick<ReportMessage, "id" | "authorRole" | "body" | "createdAt">): ReportMessage => ({
  authorName: null,
  authorAvatar: null,
  authorStaffRole: null,
  kind: "message",
  visibility: "public",
  choices: null,
  answerTo: null,
  statusTo: null,
  attachments: [],
  ...overrides
});

export const createMockReportHandlers = (): MockHandlers => {
  let status: ReportStatus = "info_requested";
  const messages: ReportMessage[] = [
    message({
      id: "m1",
      authorRole: "reporter",
      body: "The title shows Navigation instead of the video title in fullscreen.",
      createdAt: at(20)
    }),
    message({
      id: "m2",
      authorRole: "staff",
      kind: "status_change",
      body: "new",
      statusTo: "in_progress",
      createdAt: at(19)
    }),
    message({
      id: "m3",
      authorRole: "staff",
      authorName: "Marc",
      authorStaffRole: "moderator",
      body: "Thanks, we reproduced it. We are looking for the cause.",
      createdAt: at(18)
    }),
    message({
      id: "m4",
      authorRole: "staff",
      authorName: "Lea",
      authorStaffRole: "admin",
      kind: "info_request",
      body: "Does it also happen on Shorts?",
      choices: ["Yes, on Shorts too", "No, only in fullscreen"],
      createdAt: at(2)
    }),
    message({
      id: "m5",
      authorRole: "staff",
      authorName: "Marc",
      authorStaffRole: "moderator",
      kind: "note",
      visibility: "internal",
      body: "Probably the title selector since the player rework.",
      createdAt: at(1)
    })
  ];

  const publicMessages = () => messages.filter((entry) => entry.visibility === "public");
  const summary = (): ReportSummary => ({
    id: REPORT_ID,
    slug: "youtube",
    status,
    notify: true,
    lastMessageAt: at(2),
    createdAt: at(20),
    resolvedAt: null,
    unread: true,
    lastMessage: {
      authorRole: "staff",
      body: "Does it also happen on Shorts?"
    }
  });
  const staffSummary = (): StaffReportSummary => ({
    id: REPORT_ID,
    slug: "youtube",
    status,
    reporterLabel: "Anonymous",
    assigneeId: null,
    lastMessageAt: at(2),
    createdAt: at(20),
    resolvedAt: null,
    unread: true,
    lastMessage: {
      authorRole: "reporter",
      body: "The title shows Navigation instead of the video title in fullscreen."
    }
  });
  const staffDetail = (): StaffReportDetail => ({
    id: REPORT_ID,
    slug: "youtube",
    status,
    reporterLabel: "Anonymous",
    anonymous: true,
    assigneeId: STAFF_ID,
    createdAt: at(20),
    messages: [...messages]
  });

  return {
    REPORT_CREATE: () => ({
      ok: true,
      report: summary()
    }),
    REPORT_IDENTITY: () => ({ pseudo: "alice" }),
    REPORT_LIST: () => ({
      ok: true,
      reports: [summary()]
    }),
    REPORT_THREAD: () => ({
      ok: true,
      report: summary(),
      messages: publicMessages()
    }),
    REPORT_REPLY: ({ message: body, answerTo }) => {
      messages.push(
        message({
          id: `m${messages.length + 1}`,
          authorRole: "reporter",
          body,
          answerTo: answerTo ?? null,
          createdAt: new Date().toISOString()
        })
      );

      if (status === "info_requested") status = "in_progress";

      return {
        ok: true,
        messages: publicMessages()
      };
    },
    REPORT_SET_CLOSED: ({ closed }) => {
      status = closed ? "closed" : "in_progress";
      return {
        ok: true,
        ...summary()
      };
    },
    ADMIN_REPORT_LIST: () => ({
      ok: true,
      reports: [staffSummary()],
      counts: {
        new: 1,
        awaitingReporter: 1
      }
    }),
    ADMIN_REPORT_THREAD: () => ({
      ok: true,
      report: staffDetail()
    }),
    ADMIN_REPORT_SEND: ({ message: body, visibility, statusTo }) => {
      messages.push(
        message({
          id: `m${messages.length + 1}`,
          authorRole: "staff",
          authorName: "Preview",
          authorStaffRole: "moderator",
          body,
          visibility,
          kind: visibility === "internal" ? "note" : "message",
          createdAt: new Date().toISOString()
        })
      );

      if (statusTo) status = statusTo;

      return {
        ok: true,
        messages: [...messages]
      };
    },
    ADMIN_REPORT_ASSIGN: () => ({ ok: true })
  };
};
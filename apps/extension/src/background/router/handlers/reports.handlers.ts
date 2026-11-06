import type { Handler } from "@/background/router/router";
import { requestReports } from "@/background/services/reports-api";
import { getAccount } from "@/background/storage/account.store";
import { REPORT_MESSAGE_MAX_LENGTH, type ReportMessage, type ReportSummary, type StaffReportCounts, type StaffReportDetail, type StaffReportFilter, type StaffReportSummary } from "@/shared/reports";

const FIREFOX_PATTERN = /Firefox\/([\d.]+)/;
const EDGE_PATTERN = /Edg\/([\d.]+)/;
const CHROME_PATTERN = /Chrome\/([\d.]+)/;

const browserOf = (): {
  browser: string;
  browserVersion: string;
} => {
  const agent = navigator.userAgent;
  const matchers: Array<[string, RegExp]> = [
    ["Firefox", FIREFOX_PATTERN],
    ["Edge", EDGE_PATTERN],
    ["Chrome", CHROME_PATTERN]
  ];

  for (const [browser, pattern] of matchers) {
    const version = agent.match(pattern)?.[1];

    if (version) return {
      browser,
      browserVersion: version
    };
  }

  return {
    browser: "Unknown",
    browserVersion: "Unknown"
  };
};

const trimmed = (message: string): string => message.trim().slice(0, REPORT_MESSAGE_MAX_LENGTH);

export const handleReportIdentity: Handler<"REPORT_IDENTITY"> = async () => {
  const account = await getAccount();
  return {
    pseudo: account?.user.discordId ? account.user.name : null
  };
};

export const handleReportCreate: Handler<"REPORT_CREATE"> = async ({ slug, message, anonymous, notify, locale }) => {
  const text = trimmed(message);

  if (!text) return {
    ok: false,
    error: "EMPTY_MESSAGE"
  };

  const account = await getAccount();

  const label = !anonymous && account?.user.discordId ? account.user.name : undefined;
  const result = await requestReports<ReportSummary>({
    method: "POST",
    path: "/presence-reports",
    body: {
      slug,
      message: text,
      anonymous: anonymous || !label,
      notify,
      locale,
      ...browserOf(),
      extensionVersion: chrome.runtime.getManifest().version,
      ...(label ? { label, labelSource: "discord_link" } : {})
    }
  });

  if (!result.ok) return result;

  const { ok: _ok, ...report } = result;
  return {
    ok: true,
    report
  };
};

export const handleReportList: Handler<"REPORT_LIST"> = () =>
  requestReports<{
    reports: ReportSummary[];
  }>({
    method: "GET",
    path: "/presence-reports"
  });

export const handleReportThread: Handler<"REPORT_THREAD"> = ({ id }) =>
  requestReports<{
    report: ReportSummary;
    messages: ReportMessage[];
  }>({
    method: "GET",
    path: `/presence-reports/${encodeURIComponent(id)}`
  });

export const handleReportReply: Handler<"REPORT_REPLY"> = async ({ id, message, answerTo, attachments }) => {
  const text = trimmed(message);

  if (!text && !attachments?.length) return {
    ok: false,
    error: "EMPTY_MESSAGE"
  };

  return requestReports<{
    messages: ReportMessage[];
  }>({
    method: "POST",
    path: `/presence-reports/${encodeURIComponent(id)}/messages`,
    body: {
      message: text,
      ...(answerTo ? { answerTo } : {}),
      ...(attachments?.length ? { attachments } : {})
    }
  });
};

export const handleReportSetClosed: Handler<"REPORT_SET_CLOSED"> = ({ id, closed }) =>
  requestReports<ReportSummary>({
    method: "POST",
    path: `/presence-reports/${encodeURIComponent(id)}/${closed ? "close" : "reopen"}`
  });

const REPORT_FILTER_QUERY: Record<StaffReportFilter, string> = {
  todo: "?status=new",
  waiting: "?status=info_requested",
  mine: "?mine=1",
  all: ""
};

export const handleAdminReportList: Handler<"ADMIN_REPORT_LIST"> = ({ filter }) =>
  requestReports<{
    reports: StaffReportSummary[];
    counts: StaffReportCounts;
  }>({
    staff: true,
    method: "GET",
    path: `/admin/presence-reports${REPORT_FILTER_QUERY[filter]}`
  });

export const handleAdminReportThread: Handler<"ADMIN_REPORT_THREAD"> = async ({ id }) => {
  const result = await requestReports<StaffReportDetail>({
    staff: true,
    method: "GET",
    path: `/admin/presence-reports/${encodeURIComponent(id)}`
  });

  if (!result.ok) return result;

  const { ok: _ok, ...report } = result;
  return {
    ok: true,
    report
  };
};

export const handleAdminReportSend: Handler<"ADMIN_REPORT_SEND"> = async ({ id, message, visibility, statusTo, choices, attachments }) => {
  const text = trimmed(message);

  if (!text && !statusTo && !attachments?.length) return {
    ok: false,
    error: "EMPTY_MESSAGE"
  };

  return requestReports<{
    messages: ReportMessage[];
  }>({
    staff: true,
    method: "POST",
    path: `/admin/presence-reports/${encodeURIComponent(id)}/messages`,
    body: {
      message: text,
      visibility,
      ...(statusTo ? { statusTo } : {}),
      ...(choices ? { choices } : {}),
      ...(attachments?.length ? { attachments } : {})
    }
  });
};

export const handleAdminReportAssign: Handler<"ADMIN_REPORT_ASSIGN"> = ({ id, assigneeId }) =>
  requestReports<object>({
    staff: true,
    method: "PUT",
    path: `/admin/presence-reports/${encodeURIComponent(id)}/assignee`,
    body: { assigneeId }
  });
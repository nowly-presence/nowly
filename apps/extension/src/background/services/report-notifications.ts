import { openNowlyPanel } from "@/background/services/open-panel";
import { requestReports } from "@/background/services/reports-api";
import { getReporterKey } from "@/background/storage/reports.store";
import { persistAppView, setPendingSidepanelNav } from "@/shared/sidepanel-view";
import type { ReportSummary } from "@/shared/reports";

export const REPORT_UPDATES_ALARM = "report-updates";
export const REPORT_UPDATES_PERIOD_MINUTES = 5;

const REPORT_CURSOR_KEY = "reportUpdatesCursor";
const REPORT_NOTIFIED_KEY = "reportNotified";
const NOTIFICATION_PREFIX = "nowly-report:";
const PREVIEW_MAX = 120;
const NOTIFIED_MAX = 50;

type NotifiedMap = Record<string, string>;

const isNotifiedMap = (value: unknown): value is NotifiedMap => typeof value === "object" && value !== null && !Array.isArray(value);

const hasPermission = (): Promise<boolean> =>
  chrome.permissions
    .contains({
      permissions: ["notifications"]
    })
    .catch(() => false);

const notify = (report: ReportSummary): void => {
  const fixed = report.status === "fixed";
  const title = chrome.i18n.getMessage(fixed ? "reportNotifyFixedTitle" : "reportNotifyReplyTitle");
  const body = report.lastMessage?.body.replace(/\s+/g, " ").slice(0, PREVIEW_MAX) ?? "";

  void chrome.notifications.create(`${NOTIFICATION_PREFIX}${report.id}`, {
    type: "basic",
    iconUrl: chrome.runtime.getURL("icons/icon128.png"),
    title,
    message: body || title
  });
};

export const checkReportUpdates = async (): Promise<void> => {
  if (!chrome.notifications || !(await hasPermission())) return;

  await getReporterKey();
  const stored = await chrome.storage.local.get([REPORT_CURSOR_KEY, REPORT_NOTIFIED_KEY]);

  const cursor = typeof stored[REPORT_CURSOR_KEY] === "string" ? stored[REPORT_CURSOR_KEY] : null;
  const notified: NotifiedMap = isNotifiedMap(stored[REPORT_NOTIFIED_KEY]) ? stored[REPORT_NOTIFIED_KEY] : {};
  const startedAt = new Date().toISOString();
  const result = await requestReports<{
    reports: ReportSummary[];
  }>({
    method: "GET",
    path: `/presence-reports/updates${cursor ? `?since=${encodeURIComponent(cursor)}` : ""}`
  });

  if (!result.ok) return;

  if (cursor) {
    for (const report of result.reports) {
      const teamWrote = report.unread && report.notify && (report.lastMessage?.authorRole === "staff" || report.status === "fixed");

      if (!teamWrote || notified[report.id] === report.lastMessageAt) continue;

      notified[report.id] = report.lastMessageAt;
      notify(report);
    }
  }

  const trimmed = Object.fromEntries(Object.entries(notified).slice(-NOTIFIED_MAX));
  await chrome.storage.local.set({
    [REPORT_CURSOR_KEY]: startedAt,
    [REPORT_NOTIFIED_KEY]: trimmed
  });
};

export const registerReportNotificationClicks = (): void => {
  if (!chrome.notifications) return;

  chrome.notifications.onClicked.addListener((notificationId) => {
    if (!notificationId.startsWith(NOTIFICATION_PREFIX)) return;

    void (async () => {
      await setPendingSidepanelNav({
        view: "activity",
        reportId: notificationId.slice(NOTIFICATION_PREFIX.length)
      });
      persistAppView("activity");
      openNowlyPanel();
      await chrome.notifications.clear(notificationId);
    })();
  });
};
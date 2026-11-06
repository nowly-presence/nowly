export const REPORT_STATUSES = ["new", "in_progress", "info_requested", "fixed", "closed"] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_MESSAGE_MAX_LENGTH = 2000;
export const REPORT_LABEL_MAX_LENGTH = 60;
export const REPORT_CHOICES_MAX = 6;
export const REPORT_CHOICE_MAX_LENGTH = 120;
export const REPORT_MESSAGES_PER_THREAD = 60;
export const REPORT_OPEN_PER_KEY = 5;
export const REPORT_PAGE_SIZE = 50;
export const REPORT_MESSAGES_PER_WINDOW = 5;
export const REPORT_KEY_MIN_LENGTH = 32;
export const REPORT_KEY_MAX_LENGTH = 128;
export const REPORT_KEY_HEADER = "x-reporter-key";
export const REPORT_REOPEN_WINDOW_DAYS = 14;
export const REPORT_AUTO_CLOSE_DAYS = 14;
export const REPORT_ANONYMOUS_LABEL = "Anonyme";
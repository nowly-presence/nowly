export type ReportErrorCode =
  | "REPORT_NOT_FOUND"
  | "REPORT_CLOSED"
  | "REPORT_LIMIT"
  | "THREAD_FULL"
  | "INVALID_TRANSITION"
  | "INVALID_ANSWER"
  | "INVALID_ATTACHMENT"
  | "STORAGE_UNAVAILABLE";

const STATUS_BY_CODE: Record<ReportErrorCode, 404 | 409 | 422 | 429 | 503> = {
  REPORT_NOT_FOUND: 404,
  REPORT_CLOSED: 409,
  REPORT_LIMIT: 429,
  THREAD_FULL: 409,
  INVALID_TRANSITION: 409,
  INVALID_ANSWER: 409,
  INVALID_ATTACHMENT: 422,
  STORAGE_UNAVAILABLE: 503
};

export class ReportError extends Error {
  readonly code: ReportErrorCode;
  readonly status: 404 | 409 | 422 | 429 | 503;

  constructor(code: ReportErrorCode) {
    super(code);
    this.code = code;
    this.status = STATUS_BY_CODE[code];
  }
}
export type ReportErrorCode = "REPORT_NOT_FOUND" | "REPORT_CLOSED" | "REPORT_LIMIT" | "THREAD_FULL" | "INVALID_TRANSITION" | "INVALID_ANSWER";

const STATUS_BY_CODE: Record<ReportErrorCode, 404 | 409 | 429> = {
  REPORT_NOT_FOUND: 404,
  REPORT_CLOSED: 409,
  REPORT_LIMIT: 429,
  THREAD_FULL: 409,
  INVALID_TRANSITION: 409,
  INVALID_ANSWER: 409
};

export class ReportError extends Error {
  readonly code: ReportErrorCode;
  readonly status: 404 | 409 | 429;

  constructor(code: ReportErrorCode) {
    super(code);
    this.code = code;
    this.status = STATUS_BY_CODE[code];
  }
}
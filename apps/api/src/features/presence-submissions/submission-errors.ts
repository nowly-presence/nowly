export type SubmissionErrorCode =
  | "CREATOR_REQUIRED"
  | "INVALID_DEFINITION"
  | "NOT_CREATOR_PRESENCE"
  | "SUBMISSION_PENDING"
  | "SUBMISSION_LOCKED"
  | "SUBMISSION_NOT_FOUND"
  | "STALE_REVISION"
  | "INVALID_TRANSITION"
  | "OWN_SUBMISSION"
  | "NOT_PUBLISHING";

const STATUS_BY_CODE: Record<SubmissionErrorCode, 403 | 404 | 409 | 422> = {
  CREATOR_REQUIRED: 403,
  INVALID_DEFINITION: 422,
  NOT_CREATOR_PRESENCE: 409,
  SUBMISSION_PENDING: 409,
  SUBMISSION_LOCKED: 409,
  SUBMISSION_NOT_FOUND: 404,
  STALE_REVISION: 409,
  INVALID_TRANSITION: 409,
  OWN_SUBMISSION: 403,
  NOT_PUBLISHING: 409
};

export class SubmissionError extends Error {
  readonly code: SubmissionErrorCode;
  readonly status: 403 | 404 | 409 | 422;
  readonly detail: string;

  constructor(code: SubmissionErrorCode, detail: string) {
    super(code);
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.detail = detail;
  }
}
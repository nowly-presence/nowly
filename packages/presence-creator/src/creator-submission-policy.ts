import type { SubmissionStatus } from "./creator-types";

export const OPEN_STATUSES: readonly SubmissionStatus[] = ["submitted", "changes_requested", "approved", "in_progress"];
const PUBLISHABLE_STATUSES: readonly SubmissionStatus[] = ["submitted", "approved"];
export const REVIEW_VERDICTS = ["approve", "comment", "request_changes", "reject"] as const;
export const REVIEW_MESSAGE_MAX_LENGTH = 2_000;
export const FIELD_COMMENT_MAX_LENGTH = 1_000;
export const FIELD_COMMENT_FIELD_MAX_LENGTH = 64;
export const FIELD_COMMENT_PAGE_MAX_LENGTH = 40;
export const QUEUE_FILTERS = ["pending", "in_progress", "changes_requested", "published", "rejected", "all"] as const;

export type ReviewVerdict = (typeof REVIEW_VERDICTS)[number];
export type QueueFilter = (typeof QUEUE_FILTERS)[number];

const REVIEW_RULES: Record<
  ReviewVerdict,
  {
    from: readonly SubmissionStatus[];
    to: SubmissionStatus | null;
    content: "optional" | "message" | "message-or-field";
  }
> = {
  approve: {
    from: ["submitted"],
    to: "approved",
    content: "optional"
  },
  comment: {
    from: OPEN_STATUSES,
    to: null,
    content: "message-or-field"
  },
  request_changes: {
    from: ["submitted", "approved", "in_progress"],
    to: "changes_requested",
    content: "message"
  },
  reject: {
    from: ["submitted", "approved"],
    to: "rejected",
    content: "message"
  }
};

const includesStatus = (statuses: readonly SubmissionStatus[], status: string): boolean => (statuses as readonly string[]).includes(status);

export const isEditableSubmissionStatus = (status: string): boolean => status === "changes_requested" || status === "rejected";

export const canPublishSubmission = (status: string): boolean => includesStatus(PUBLISHABLE_STATUSES, status);

export const verdictTarget = (verdict: ReviewVerdict, status: string) => {
  const rule = REVIEW_RULES[verdict];
  return {
    allowed: includesStatus(rule.from, status),
    to: rule.to
  };
};

export const allowedVerdicts = (status: SubmissionStatus): ReviewVerdict[] => REVIEW_VERDICTS.filter((verdict) => verdictTarget(verdict, status).allowed);

export const reviewIsValid = (verdict: ReviewVerdict, message: string, commentCount: number): boolean => {
  const { content } = REVIEW_RULES[verdict];
  return content === "optional" || Boolean(message.trim()) || (content === "message-or-field" && commentCount > 0);
};

const PENDING_QUEUE_STATUSES = [...new Set([...REVIEW_RULES.approve.from, ...PUBLISHABLE_STATUSES])];

export const queueStatuses = (filter: QueueFilter): readonly SubmissionStatus[] | null => {
  if (filter === "pending") return PENDING_QUEUE_STATUSES;

  return filter === "all" ? null : [filter];
};
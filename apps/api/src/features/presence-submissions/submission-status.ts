import type { SubmissionStatus } from "@nowly/presence-creator";

export const OPEN_STATUSES: readonly SubmissionStatus[] = ["submitted", "changes_requested", "approved", "in_progress"];

export const EDITABLE_STATUSES: readonly SubmissionStatus[] = ["changes_requested", "rejected"];

export const REVIEW_VERDICTS = ["approve", "comment", "request_changes", "reject"] as const;

export type ReviewVerdict = (typeof REVIEW_VERDICTS)[number];

const VERDICT_TRANSITIONS: Record<
  ReviewVerdict,
  {
    from: readonly SubmissionStatus[];
    to: SubmissionStatus | null;
  }
> = {
  approve: {
    from: ["submitted"],
    to: "approved"
  },
  comment: {
    from: ["submitted", "changes_requested", "approved", "in_progress"],
    to: null
  },
  request_changes: {
    from: ["submitted", "approved", "in_progress"],
    to: "changes_requested"
  },
  reject: {
    from: ["submitted", "approved"],
    to: "rejected"
  }
};

export const PUBLISHABLE_STATUSES: readonly SubmissionStatus[] = ["submitted", "approved"];

export const verdictTarget = (verdict: ReviewVerdict, status: string): {
  allowed: boolean;
  to: SubmissionStatus | null;
} => {
  const transition = VERDICT_TRANSITIONS[verdict];
  return {
    allowed: (transition.from as readonly string[]).includes(status),
    to: transition.to
  };
};

export const isOneOf = (status: string, statuses: readonly SubmissionStatus[]): boolean => (statuses as readonly string[]).includes(status);
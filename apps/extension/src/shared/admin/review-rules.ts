import type { SubmissionStatus } from "@nowly/presence-creator/creator-types";
import { REVIEW_VERDICTS, type ReviewVerdict } from "@/shared/admin/admin-types";

const VERDICT_SOURCES: Record<ReviewVerdict, readonly SubmissionStatus[]> = {
  approve: ["submitted"],
  comment: ["submitted", "changes_requested", "approved", "in_progress"],
  request_changes: ["submitted", "approved", "in_progress"],
  reject: ["submitted", "approved"]
};

const PUBLISHABLE: readonly SubmissionStatus[] = ["submitted", "approved"];

export const allowedVerdicts = (status: SubmissionStatus): ReviewVerdict[] => REVIEW_VERDICTS.filter((verdict) => VERDICT_SOURCES[verdict].includes(status));

export const canPublish = (status: SubmissionStatus): boolean => PUBLISHABLE.includes(status);

export const verdictNeedsMessage = (verdict: ReviewVerdict): boolean => verdict === "request_changes" || verdict === "reject";

export const reviewIsValid = (verdict: ReviewVerdict, message: string, commentCount: number): boolean => {
  if (verdictNeedsMessage(verdict)) return message.trim().length > 0;
  if (verdict === "comment") return message.trim().length > 0 || commentCount > 0;

  return true;
};
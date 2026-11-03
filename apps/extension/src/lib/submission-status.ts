import type { MessageKey } from "@/hooks/i18n-provider";
import type { CreatorDraft, SubmissionStatus } from "@nowly/presence-creator/creator-types";

type BadgeTone = "neutral" | "primary" | "success" | "danger" | "outline";

export const SUBMISSION_TONES: Record<SubmissionStatus, BadgeTone> = {
  submitted: "primary",
  changes_requested: "danger",
  approved: "primary",
  in_progress: "primary",
  published: "success",
  rejected: "danger"
};

const STATUS_KEYS: Record<SubmissionStatus, MessageKey> = {
  submitted: "creator.status.submitted",
  changes_requested: "creator.status.changesRequested",
  approved: "creator.status.approved",
  in_progress: "creator.status.inProgress",
  published: "creator.status.published",
  rejected: "creator.status.rejected"
};

export const submissionStatusKey = (status: SubmissionStatus): MessageKey => STATUS_KEYS[status];

export const statusKey = (draft: CreatorDraft): MessageKey => (draft.submission ? STATUS_KEYS[draft.submission.status] : "creator.status.draft");
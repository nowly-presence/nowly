import type { CreatorTextFile } from "./creator-export";
import type { CreatorAuthor, CreatorDraft, CreatorSubmission, SubmissionStatus } from "./creator-types";

export type CreatorAccountUser = {
  id: string;
  name: string;
  image: string | null;
  discordId: string | null;
};

export type CreatorAccount = {
  user: CreatorAccountUser;
  creator: boolean;
};

export type CreatorSubmissionPayload = {
  definition: Omit<CreatorDraft, "assets" | "submission">;
  translate: boolean;
  files: CreatorTextFile[];
  assets: {
    logo: string;
    icon: string;
    thumbnail: string;
    thumbnailRightsConfirmed: boolean;
  };
};

export type CreatorSubmitError = "UNAUTHORIZED" | "CREATOR_REQUIRED" | "UNAVAILABLE" | "INVALID" | "NETWORK";

export type CreatorSubmitResult = {
  ok: true;
  submission: CreatorSubmission;
} | {
  ok: false;
  error: CreatorSubmitError;
  message?: string;
};

export const SUBMISSION_STATUSES: readonly SubmissionStatus[] = ["submitted", "changes_requested", "approved", "in_progress", "published", "rejected"];

export const SUBMISSION_TIMELINE: readonly SubmissionStatus[] = ["submitted", "approved", "in_progress", "published"];

export const isSubmissionStatus = (value: unknown): value is SubmissionStatus =>
  typeof value === "string" && (SUBMISSION_STATUSES as readonly string[]).includes(value);

export const authorFromAccount = (account: CreatorAccount): CreatorAuthor => ({
  name: account.user.name,
  discord: account.user.discordId ?? undefined
});

export const sameAuthor = (a: CreatorAuthor, b: CreatorAuthor): boolean => a.name === b.name && a.github === b.github && a.discord === b.discord;

export const parseSubmission = (value: unknown): CreatorSubmission | null => {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;

  if (typeof record.id !== "string" || !isSubmissionStatus(record.status)) return null;

  return {
    id: record.id,
    status: record.status,
    revision: typeof record.revision === "number" ? record.revision : undefined,
    updatedAt: typeof record.updatedAt === "string" ? Date.parse(record.updatedAt) || Date.now() : Date.now(),
    prUrl: typeof record.prUrl === "string" ? record.prUrl : undefined,
    note: typeof record.note === "string" ? record.note : undefined
  };
};

export const canEditSubmission = (submission: CreatorSubmission | undefined): boolean =>
  !submission || submission.status === "changes_requested" || submission.status === "rejected";
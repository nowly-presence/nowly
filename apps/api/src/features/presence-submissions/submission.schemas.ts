import { z } from "zod";
import { REVIEW_VERDICTS } from "./submission-status";

export const SUBMISSION_BODY_LIMIT = 8 * 1024 * 1024;
export const SUBMISSIONS_PER_HOUR = 5;
export const REVIEW_MESSAGE_MAX_LENGTH = 2_000;
export const FIELD_COMMENTS_MAX = 50;
export const FIELD_COMMENT_MAX_LENGTH = 1_000;
const IDS_MAX = 50;
const ID_PATTERN = /^[a-f0-9]{24}$/;
const FIELD_MAX_LENGTH = 64;
const PAGE_LABEL_MAX_LENGTH = 40;
const SLUG_PATTERN = /^[a-z0-9][a-z0-9.+!&'-]{0,63}$/;
const COMMIT_PATTERN = /^[a-f0-9]{7,40}$/;

export const SubmitBodySchema = z.object({
  definition: z.unknown(),
  translate: z.boolean().default(false),
  assets: z.object({
    thumbnail: z.string(),
    logo: z.string(),
    icon: z.string(),
    thumbnailRightsConfirmed: z.literal(true)
  })
});

export const SubmissionIdsSchema = z
  .string()
  .transform((value) =>
    value
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  )
  .pipe(z.array(z.string().regex(ID_PATTERN)).max(IDS_MAX));

const FieldCommentSchema = z.strictObject({
  field: z.string().min(1).max(FIELD_MAX_LENGTH),
  page: z.string().min(1).max(PAGE_LABEL_MAX_LENGTH).optional(),
  message: z.string().trim().min(1).max(FIELD_COMMENT_MAX_LENGTH)
});

export const ReviewBodySchema = z
  .strictObject({
    revision: z.number().int().positive(),
    verdict: z.enum(REVIEW_VERDICTS),
    message: z.string().trim().max(REVIEW_MESSAGE_MAX_LENGTH).default(""),
    comments: z.array(FieldCommentSchema).max(FIELD_COMMENTS_MAX).default([])
  })
  .refine((review) => {
    if (review.verdict === "request_changes" || review.verdict === "reject") return review.message.length > 0;
    if (review.verdict === "comment") return review.message.length > 0 || review.comments.length > 0;

    return true;
  }, "A message is required");

export const PublishBodySchema = z.strictObject({ revision: z.number().int().positive() });

export const QueueFilterSchema = z.strictObject({ status: z.enum(["pending", "in_progress", "changes_requested", "published", "rejected", "all"]).default("pending") });

export const PullRequestClosedWebhookSchema = z.strictObject({
  slug: z.string().regex(SLUG_PATTERN),
  pr: z.number().int().positive()
});

export const PublishedWebhookSchema = z.strictObject({
  slug: z.string().regex(SLUG_PATTERN),
  commit: z.string().regex(COMMIT_PATTERN),
  pr: z.number().int().positive()
});
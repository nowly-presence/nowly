import { RiChat3Line } from "@remixicon/react";
import { useI18n, type MessageKey } from "@/hooks/i18n-provider";
import { formatDateTime } from "@/lib/format";
import { commentTarget } from "@/lib/review-fields";
import type { ReviewVerdict, SubmissionReview } from "@/shared/admin/admin-types";
import { Badge } from "@/ui/badge";
import { Card } from "@/ui/card";

type Tone = "neutral" | "primary" | "success" | "danger" | "outline";

const VERDICT_KEYS: Record<ReviewVerdict, MessageKey> = {
  approve: "submissionReview.verdict.approve",
  comment: "submissionReview.verdict.comment",
  request_changes: "submissionReview.verdict.requestChanges",
  reject: "submissionReview.verdict.reject"
};

const VERDICT_TONES: Record<ReviewVerdict, Tone> = {
  approve: "success",
  comment: "neutral",
  request_changes: "primary",
  reject: "danger"
};

export const verdictLabelKey = (verdict: ReviewVerdict): MessageKey => VERDICT_KEYS[verdict];

export const ReviewThread = ({ reviews, showRevision = true }: {
  reviews: SubmissionReview[];
  showRevision?: boolean;
}) => {
  const { t, locale } = useI18n();

  if (reviews.length === 0) return (
    <p className="px-1 text-label-md text-muted">
      {t("submissionReview.empty")}
    </p>
  );

  return (
    <ol className="flex flex-col gap-2">
      {reviews.map((review) => (
        <li key={review.id}>
          <Card className="flex flex-col gap-2 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={VERDICT_TONES[review.verdict]}>{t(VERDICT_KEYS[review.verdict])}</Badge>
              <span className="min-w-0 flex-1 truncate text-label-md font-medium">{review.reviewer?.name ?? t("submissionReview.unknownReviewer")}</span>
              {showRevision && <span className="text-label-sm text-muted">{t("submissionReview.revision", { number: review.revision })}</span>}
            </div>
            {review.message && <p className="text-body-sm whitespace-pre-wrap">{review.message}</p>}
            {review.comments.length > 0 && (
              <ul className="flex flex-col gap-1.5 border-t border-line pt-2">
                {review.comments.map((comment, index) => (
                  <li key={`${comment.field}:${comment.page ?? ""}:${index}`} className="flex items-start gap-2 text-label-md">
                    <RiChat3Line className="mt-0.5 size-4 shrink-0 text-muted" />
                    <span className="flex min-w-0 flex-col">
                      <span className="font-medium">{commentTarget(comment, t)}</span>
                      <span className="whitespace-pre-wrap text-muted">{comment.message}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <time dateTime={new Date(review.createdAt).toISOString()} className="text-label-sm text-muted">
              {formatDateTime(review.createdAt, locale)}
            </time>
          </Card>
        </li>
      ))}
    </ol>
  );
};
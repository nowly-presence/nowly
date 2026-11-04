import { useState } from "react";
import { RiArrowDownSLine } from "@remixicon/react";
import { ReviewThread } from "@/components/shared/review-thread";
import { useI18n, type MessageKey } from "@/hooks/i18n-provider";
import type { SubmissionReview } from "@/shared/admin/admin-types";
import type { CreatorSubmission, SubmissionStatus } from "@nowly/presence-creator/creator-types";
import { SUBMISSION_TIMELINE } from "@nowly/presence-creator/creator-submission";
import { submissionStatusKey } from "@/lib/submission-status";
import { cn } from "@/ui/cn";

const COMMENT_TITLE_KEYS: Partial<Record<SubmissionStatus, MessageKey>> = {
  rejected: "creator.submit.commentRejected",
  changes_requested: "creator.submit.commentChanges"
};

const latestRound = (reviews: SubmissionReview[]): {
  latest: SubmissionReview[];
  earlier: SubmissionReview[];
} => {
  const last = Math.max(0, ...reviews.map((review) => review.revision));
  return {
    latest: reviews.filter((review) => review.revision === last),
    earlier: reviews.filter((review) => review.revision !== last)
  };
};

const History = ({ reviews, showRevision }: {
  reviews: SubmissionReview[];
  showRevision: boolean;
}) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-1 self-start text-label-md font-medium text-muted hover:text-ink"
      >
        {t("creator.submit.history", { count: reviews.length })}
        <RiArrowDownSLine className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && <ReviewThread reviews={reviews} showRevision={showRevision} />}
    </div>
  );
};

export const SubmissionFeedback = ({ submission, reviews, actionable }: {
  submission: CreatorSubmission;
  reviews: SubmissionReview[];
  actionable: boolean;
}) => {
  const { t } = useI18n();
  const showRevision = new Set(reviews.map((review) => review.revision)).size > 1;

  if (actionable) {
    const { latest, earlier } = latestRound(reviews);
    const title = COMMENT_TITLE_KEYS[submission.status] ?? "creator.submit.commentRejected";

    return (
      <div className="flex flex-col gap-3">
        <span className="text-label-lg font-medium">{t(title)}</span>
        {latest.length > 0 ? (
          <ReviewThread reviews={latest} showRevision={false} />
        ) : (
          submission.note && <p className="rounded-md bg-hover p-3 text-label-md">{submission.note}</p>
        )}
        {earlier.length > 0 && <History reviews={earlier} showRevision={showRevision} />}
      </div>
    );
  }

  const currentIndex = SUBMISSION_TIMELINE.indexOf(submission.status);

  return (
    <div className="flex flex-col gap-3">
      <span className="text-label-lg font-medium">{t(submissionStatusKey(submission.status))}</span>
      {currentIndex >= 0 && (
        <ol className="flex flex-col gap-2">
          {SUBMISSION_TIMELINE.map((status, index) => (
            <li key={status} className={cn("flex items-center gap-2 text-label-md", index <= currentIndex ? "text-ink" : "text-muted")}>
              <span className={cn("size-2 rounded-full", index < currentIndex ? "bg-success" : index === currentIndex ? "bg-primary" : "bg-line-strong")} />
              {t(submissionStatusKey(status))}
            </li>
          ))}
        </ol>
      )}
      {reviews.length > 0 && <History reviews={reviews} showRevision={showRevision} />}
    </div>
  );
};
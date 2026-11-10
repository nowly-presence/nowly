"use client";

import { PageHeader } from "@/features/shell/components/page-header";
import { SubmissionChanges } from "@/features/account/components/submission-changes";
import { SubmissionFiles } from "@/features/account/components/submission-files";
import { SubmissionPreview } from "@/features/account/components/submission-preview";
import { SubmissionReviewForm } from "@/features/account/components/submission-review-form";
import { SubmissionStatusBadge } from "@/features/account/components/submission-status-badge";
import { SubmissionThread } from "@/features/account/components/submission-thread";
import { publishSubmission, sendReview, type FieldComment, type ReviewVerdict } from "@/features/account/lib/submission-api";
import { submissionSubtitle } from "@/features/account/lib/submission-text";
import { useSubmission } from "@/features/account/lib/use-submission";
import { ButtonLink } from "@/components/button-link";
import { Button } from "@nowly/ui";
import { RiArrowLeftLine, RiExternalLinkLine } from "@nowly/ui/icons";
import { useTranslations } from "next-intl";

export const SubmissionView = ({ id }: {
  id: string;
}) => {
  const t = useTranslations("submissionPage");
  const { load, detail, busy, error, act, reviewer, publisher, canPublish, verdicts } = useSubmission(id);

  const onReview = (review: {
    verdict: ReviewVerdict;
    message: string;
    comments: FieldComment[];
  }): Promise<boolean> => {
    if (!detail) return Promise.resolve(false);

    return act(() =>
      sendReview(id, {
        ...review,
        revision: detail.revision
      })
    );
  };

  const onPublish = (): void => {
    if (!detail || !window.confirm(t("publish-confirm"))) return;

    void act(() => publishSubmission(id, detail.revision));
  };

  return (
    <>
      <ButtonLink href="/creations" variant="ghost" size="sm">
        <RiArrowLeftLine data-icon="inline-start" />
        {t("back")}
      </ButtonLink>

      <div className="mt-4">
        <PageHeader title={detail?.name ?? t("title")} description={t("description")} />
      </div>

      {load === "checking" ? <p className="mt-6 text-sm text-muted-foreground">{t("checking")}</p> : null}
      {load === "error" ? <p className="mt-6 text-sm text-destructive">{t("action-error")}</p> : null}
      {load === "not-found" ? <p className="mt-6 text-sm text-muted-foreground">{t("not-found")}</p> : null}

      {load === "ready" && detail ? (
        <div className="mt-2 flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-2">
              <div>
                <SubmissionStatusBadge status={detail.status} />
              </div>
              <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                <span>{submissionSubtitle(detail, t)}</span>
                {detail.pullRequest.url ? (
                  <a
                    href={detail.pullRequest.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-foreground underline underline-offset-4"
                  >
                    {t("pull-request")}
                    <RiExternalLinkLine className="size-3.5" />
                  </a>
                ) : null}
              </p>
            </div>
            {canPublish ? (
              <Button disabled={busy} onClick={onPublish}>
                {t("publish")}
              </Button>
            ) : null}
          </div>
          {detail.note ? <p className="max-w-2xl whitespace-pre-wrap rounded-xl bg-muted px-4 py-3 text-sm">{detail.note}</p> : null}
          {detail.pullRequest.error && reviewer ? (
            <p className="text-sm text-destructive">
              {t("pull-request-error")} <span className="break-words font-mono text-xs">{detail.pullRequest.error}</span>
            </p>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
            <div className="flex min-w-0 flex-col gap-6">
              {detail.definition ? <SubmissionPreview definition={detail.definition} assets={detail.assets} /> : null}
              <SubmissionChanges revisions={detail.revisions} />
              {reviewer || publisher ? <SubmissionFiles files={detail.files} /> : null}
            </div>
            <div className="flex min-w-0 flex-col gap-6">
              <SubmissionThread detail={detail} />
              {reviewer && verdicts.length ? (
                <SubmissionReviewForm key={detail.reviews.length} allowedVerdicts={verdicts} busy={busy} error={error} onSubmit={onReview} />
              ) : null}
              {!reviewer && error ? <p className="text-sm text-destructive">{error}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
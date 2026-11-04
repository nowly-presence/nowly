"use client";

import { PageHeader } from "@/features/shell/components/page-header";
import { SubmissionChanges } from "@/features/account/components/submission-changes";
import { SubmissionFiles } from "@/features/account/components/submission-files";
import { SubmissionPreview } from "@/features/account/components/submission-preview";
import { SubmissionReviewForm } from "@/features/account/components/submission-review-form";
import { SubmissionStatusBadge } from "@/features/account/components/submission-status-badge";
import { SubmissionThread } from "@/features/account/components/submission-thread";
import { useSessionUser } from "@/features/account/components/session-provider";
import { fetchSubmission, publishSubmission, sendReview, SubmissionRequestError, type FieldComment, type ReviewVerdict, type SubmissionDetail } from "@/features/account/lib/submission-api";
import { allowedVerdicts, PUBLISHABLE_STATUSES } from "@/features/account/lib/submission-text";
import { ButtonLink } from "@/components/button-link";
import { Button } from "@nowly/ui";
import { RiArrowLeftLine, RiExternalLinkLine } from "@nowly/ui/icons";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

type Status = "checking" | "not-found" | "ready" | "error";

const errorMessageKey = (error: unknown): "error-stale" | "error-forbidden" | "action-error" => {
  if (error instanceof SubmissionRequestError) {
    if (error.code === "STALE_REVISION") return "error-stale";
    if (error.status === 403) return "error-forbidden";
  }

  return "action-error";
};

export const SubmissionView = ({ id }: {
  id: string;
}) => {
  const t = useTranslations("submissionPage");
  const [status, setStatus] = useState<Status>("checking");
  const user = useSessionUser();
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      setDetail(await fetchSubmission(id));
      setStatus("ready");
    } catch (failure) {
      setStatus(failure instanceof SubmissionRequestError && failure.status === 404 ? "not-found" : "error");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (action: () => Promise<void>): Promise<boolean> => {
    setBusy(true);
    setError(null);

    try {
      await action();
      setDetail(await fetchSubmission(id));
      return true;
    } catch (failure) {
      setError(t(errorMessageKey(failure)));
      return false;
    } finally {
      setBusy(false);
    }
  };

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

  const isAuthor = detail?.author?.id === user.id;
  const reviewer = user.capabilities.includes("review") && !isAuthor;
  const publisher = user.capabilities.includes("publish");
  const verdicts = detail ? allowedVerdicts(detail.status) : [];
  const canPublish = publisher && detail !== null && PUBLISHABLE_STATUSES.includes(detail.status);

  return (
    <>
      <ButtonLink href="/creations" variant="ghost" size="sm">
        <RiArrowLeftLine data-icon="inline-start" />
        {t("back")}
      </ButtonLink>

      <div className="mt-4">
        <PageHeader title={detail?.name ?? t("title")} description={t("description")} />
      </div>

      {status === "checking" ? <p className="mt-6 text-sm text-muted-foreground">{t("checking")}</p> : null}
      {status === "error" ? <p className="mt-6 text-sm text-destructive">{t("action-error")}</p> : null}
      {status === "not-found" ? <p className="mt-6 text-sm text-muted-foreground">{t("not-found")}</p> : null}

      {status === "ready" && detail ? (
        <div className="mt-2 flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-2">
              <div>
                <SubmissionStatusBadge status={detail.status} />
              </div>
              <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                <span>
                  {[
                    detail.kind === "update" ? t("kind-update") : t("kind-create"),
                    t("revision-heading", { number: detail.revision }),
                    detail.author?.name ? t("by-author", { name: detail.author.name }) : null
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
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
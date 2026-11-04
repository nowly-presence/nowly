"use client";

import { SubmissionChanges } from "@/features/account/components/submission-changes";
import { SubmissionFiles } from "@/features/account/components/submission-files";
import { useSessionUser } from "@/features/account/components/session-provider";
import { SubmissionStatusBadge } from "@/features/account/components/submission-status-badge";
import { SubmissionThread } from "@/features/account/components/submission-thread";
import {
  fetchSubmission,
  publishSubmission,
  sendReview,
  SubmissionRequestError,
  type FieldComment,
  type ReviewVerdict,
  type SubmissionDetail
} from "@/features/account/lib/submission-api";
import { allowedVerdicts, PUBLISHABLE_STATUSES } from "@/features/account/lib/submission-text";
import { StaffReviewSection } from "@/features/staff/components/staff-review-sections";
import { REVIEW_SECTIONS, SECTION_FIELD, type ReviewSection, type SectionVerdict } from "@/features/staff/lib/review-sections";
import { Link } from "@/i18n/navigation";
import { Button, Card, CardContent, Progress, Textarea } from "@nowly/ui";
import { RiArrowLeftLine, RiExternalLinkLine } from "@nowly/ui/icons";
import { cn } from "@nowly/ui/utils";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

type Load = "checking" | "not-found" | "ready" | "error";

const PERCENT = 100;

export const StaffReviewDetail = ({ id }: { id: string }) => {
  const t = useTranslations("staff");
  const sub = useTranslations("submissionPage");
  const user = useSessionUser();
  const [load, setLoad] = useState<Load>("checking");
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [marks, setMarks] = useState<Record<ReviewSection, SectionVerdict>>({ identity: null, images: null, texts: null, pages: null, domains: null });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmPublish, setConfirmPublish] = useState(false);

  const reload = useCallback(async (): Promise<void> => {
    try {
      setDetail(await fetchSubmission(id));
      setLoad("ready");
    } catch (failure) {
      setLoad(failure instanceof SubmissionRequestError && failure.status === 404 ? "not-found" : "error");
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const act = async (action: () => Promise<void>): Promise<void> => {
    setBusy(true);
    setError(null);

    try {
      await action();
      await reload();
      setMessage("");
      setConfirmPublish(false);
    } catch (failure) {
      setError(failure instanceof SubmissionRequestError && failure.code === "STALE_REVISION" ? sub("error-stale") : failure instanceof SubmissionRequestError && failure.status === 403 ? sub("error-forbidden") : t("error"));
    } finally {
      setBusy(false);
    }
  };

  const decide = (verdict: ReviewVerdict): void => {
    if (!detail) return;

    const comments: FieldComment[] = REVIEW_SECTIONS.filter((section) => marks[section] === "fix").map((section) => ({ field: SECTION_FIELD[section], message: t("fix-comment", { section: t(`sec-${section}`) }) }));
    void act(() => sendReview(id, { revision: detail.revision, verdict, message: message.trim(), comments }));
  };

  const done = REVIEW_SECTIONS.filter((section) => marks[section] === "ok").length;
  const flagged = REVIEW_SECTIONS.filter((section) => marks[section] === "fix").length;
  const isAuthor = detail?.author?.id === user.id;
  const reviewer = user.capabilities.includes("review") && !isAuthor;
  const verdicts = detail ? allowedVerdicts(detail.status) : [];
  const canPublish = user.capabilities.includes("publish") && detail !== null && PUBLISHABLE_STATUSES.includes(detail.status);
  const definition = detail?.definition ?? null;
  const needsMessage = message.trim().length === 0 && flagged === 0;

  return (
    <>
      <Link href="/moderation/review" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <RiArrowLeftLine className="size-4" />
        {t("detail-back")}
      </Link>
      {load === "checking" ? <p className="text-sm text-muted-foreground">{t("loading")}</p> : null}
      {load === "error" ? <p className="text-sm text-destructive">{t("error")}</p> : null}
      {load === "not-found" ? <p className="text-sm text-muted-foreground">{sub("not-found")}</p> : null}
      {load === "ready" && detail ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
          <div className="flex min-w-0 flex-col gap-4">
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">{detail.name}</h1>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                  <span>{[detail.kind === "update" ? sub("kind-update") : sub("kind-create"), sub("revision-heading", { number: detail.revision }), detail.author?.name ? sub("by-author", { name: detail.author.name }) : null].filter(Boolean).join(", ")}</span>
                  {detail.pullRequest.url ? (
                    <a href={detail.pullRequest.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-foreground underline underline-offset-4">
                      {sub("pull-request")}
                      <RiExternalLinkLine className="size-3.5" />
                    </a>
                  ) : null}
                </p>
              </div>
              <SubmissionStatusBadge status={detail.status} />
            </header>
            {detail.pullRequest.error ? <p className="text-sm text-destructive">{sub("pull-request-error")} <span className="break-words font-mono text-xs">{detail.pullRequest.error}</span></p> : null}
            {detail.note ? <p className="whitespace-pre-wrap rounded-[10px] bg-foreground/4 px-4 py-3 text-sm ring-1 ring-foreground/10">{detail.note}</p> : null}
            <div className="flex items-center gap-3">
              <Progress value={(done / REVIEW_SECTIONS.length) * PERCENT} className="flex-1" />
              <span className="text-xs text-muted-foreground">{t("detail-progress", { done, total: REVIEW_SECTIONS.length })}</span>
            </div>
            {definition
              ? REVIEW_SECTIONS.map((section) => (
                  <Card key={section}>
                    <CardContent className="flex flex-col gap-4">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="text-base font-medium text-foreground">{t(`sec-${section}`)}</h2>
                        {reviewer ? (
                          <div className="flex gap-1">
                            <Button size="sm" variant={marks[section] === "ok" ? "default" : "outline"} aria-pressed={marks[section] === "ok"} onClick={() => setMarks((current) => ({ ...current, [section]: current[section] === "ok" ? null : "ok" }))}>
                              {t("sec-ok")}
                            </Button>
                            <Button size="sm" variant={marks[section] === "fix" ? "destructive" : "outline"} aria-pressed={marks[section] === "fix"} onClick={() => setMarks((current) => ({ ...current, [section]: current[section] === "fix" ? null : "fix" }))}>
                              {t("sec-fix")}
                            </Button>
                          </div>
                        ) : null}
                      </div>
                      <div className={cn(marks[section] === "fix" && "rounded-[10px] ring-1 ring-destructive/40")}>
                        <StaffReviewSection section={section} definition={definition} assets={detail.assets} />
                      </div>
                    </CardContent>
                  </Card>
                ))
              : null}
            <SubmissionChanges revisions={detail.revisions} />
            <SubmissionFiles files={detail.files} />
          </div>
          <div className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-6 xl:self-start">
            {reviewer && verdicts.length > 0 ? (
              <Card>
                <CardContent className="flex flex-col gap-3">
                  <h2 className="text-base font-medium text-foreground">{t("detail-decision")}</h2>
                  <Textarea value={message} disabled={busy} placeholder={t("peek-message-placeholder")} aria-label={t("peek-message-placeholder")} onChange={(event) => setMessage(event.target.value)} />
                  {flagged > 0 ? <p className="text-xs text-muted-foreground">{t("detail-flagged", { count: flagged })}</p> : null}
                  {error ? <p className="text-sm text-destructive">{error}</p> : null}
                  <div className="flex flex-col gap-2">
                    {verdicts.includes("approve") ? (
                      <Button disabled={busy || flagged > 0} onClick={() => decide("approve")}>
                        {sub("verdict-approve")}
                      </Button>
                    ) : null}
                    {verdicts.includes("request_changes") ? (
                      <Button variant="outline" disabled={busy || needsMessage} onClick={() => decide("request_changes")}>
                        {t("peek-request")}
                      </Button>
                    ) : null}
                    {verdicts.includes("reject") ? (
                      <Button variant="destructive" disabled={busy || message.trim().length === 0} onClick={() => decide("reject")}>
                        {t("peek-reject")}
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ) : null}
            {canPublish ? (
              <Card>
                <CardContent className="flex flex-col gap-2">
                  {confirmPublish ? (
                    <>
                      <p className="text-sm text-muted-foreground">{sub("publish-confirm")}</p>
                      <div className="flex gap-2">
                        <Button disabled={busy} onClick={() => void act(() => publishSubmission(id, detail.revision))}>
                          {t("detail-publish-confirm")}
                        </Button>
                        <Button variant="ghost" disabled={busy} onClick={() => setConfirmPublish(false)}>
                          {t("peek-cancel")}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button variant="secondary" disabled={busy} onClick={() => setConfirmPublish(true)}>
                      {sub("publish")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : null}
            <SubmissionThread detail={detail} />
          </div>
        </div>
      ) : null}
    </>
  );
};

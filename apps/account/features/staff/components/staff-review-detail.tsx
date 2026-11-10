"use client";

import { SubmissionChanges } from "@/features/account/components/submission-changes";
import { SubmissionFiles } from "@/features/account/components/submission-files";
import { SubmissionStatusBadge } from "@/features/account/components/submission-status-badge";
import { SubmissionThread } from "@/features/account/components/submission-thread";
import { publishSubmission, sendReview, type FieldComment, type ReviewVerdict } from "@/features/account/lib/submission-api";
import { submissionSubtitle } from "@/features/account/lib/submission-text";
import { useSubmission } from "@/features/account/lib/use-submission";
import { Frame } from "@/features/shell/components/frame";
import { StaffReviewSection } from "@/features/staff/components/staff-review-sections";
import { REVIEW_SECTIONS, SECTION_FIELD, type ReviewSection, type SectionVerdict } from "@/features/staff/lib/review-sections";
import { Link } from "@/i18n/navigation";
import { Button, Progress, RadioGroup, RadioGroupItem, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, Textarea } from "@nowly/ui";
import { RiArrowLeftLine, RiExternalLinkLine } from "@nowly/ui/icons";
import { cn } from "@nowly/ui/utils";
import { useTranslations } from "next-intl";
import { useState } from "react";

type DecisionVerdict = Extract<ReviewVerdict, "approve" | "request_changes" | "reject">;

const DECISIONS: readonly DecisionVerdict[] = ["approve", "request_changes", "reject"];
const MARK_OPTIONS = ["pending", "ok", "fix"] as const;

const PERCENT = 100;

export const StaffReviewDetail = ({ id }: {
  id: string;
}) => {
  const t = useTranslations("staff");
  const sub = useTranslations("submissionPage");
  const { load, detail, busy, error, act: runAction, reviewer, canPublish, verdicts } = useSubmission(id, t("error"));
  const [marks, setMarks] = useState<Record<ReviewSection, SectionVerdict>>({
    identity: null,
    images: null,
    texts: null,
    pages: null,
    domains: null
  });
  const [message, setMessage] = useState("");
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [verdict, setVerdict] = useState<DecisionVerdict | null>(null);

  const act = async (action: () => Promise<void>): Promise<void> => {
    if (!(await runAction(action))) return;

    setMessage("");
    setConfirmPublish(false);
  };

  const decide = (value: ReviewVerdict): void => {
    if (!detail) return;

    const comments: FieldComment[] = REVIEW_SECTIONS.filter((section) => marks[section] === "fix").map((section) => ({
      field: SECTION_FIELD[section],
      message: t("fix-comment", { section: t(`sec-${section}`) })
    }));
    void act(() =>
      sendReview(id, {
        revision: detail.revision,
        verdict: value,
        message: message.trim(),
        comments
      })
    );
  };

  const done = REVIEW_SECTIONS.filter((section) => marks[section] === "ok").length;
  const flagged = REVIEW_SECTIONS.filter((section) => marks[section] === "fix").length;
  const decisions = DECISIONS.filter((value) => verdicts.includes(value));

  const choice = verdict && decisions.includes(verdict) ? verdict : (decisions[0] ?? null);
  const definition = detail?.definition ?? null;
  const hasMessage = message.trim().length > 0;
  const canSubmit = choice === "approve" ? flagged === 0 : choice === "request_changes" ? hasMessage || flagged > 0 : choice === "reject" ? hasMessage : false;
  const markLabel = (value: (typeof MARK_OPTIONS)[number]): string => t(`mark-${value}`);

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
            <Frame
              title={detail.name}
              description={submissionSubtitle(detail, sub)}
              action={
                <>
                  {detail.pullRequest.url ? (
                    <a
                      href={detail.pullRequest.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-foreground underline underline-offset-4"
                    >
                      {sub("pull-request")}
                      <RiExternalLinkLine className="size-3.5" />
                    </a>
                  ) : null}
                  <SubmissionStatusBadge status={detail.status} />
                </>
              }
            >
              {detail.note ? <p className="whitespace-pre-wrap border-l-2 border-foreground/15 pl-3 text-sm text-muted-foreground">{detail.note}</p> : null}
              {detail.pullRequest.error ? (
                <p className="text-sm text-destructive">
                  {sub("pull-request-error")} <span className="break-words font-mono text-xs">{detail.pullRequest.error}</span>
                </p>
              ) : null}
              <div className="flex items-center gap-3">
                <Progress value={(done / REVIEW_SECTIONS.length) * PERCENT} className="flex-1" />
                <span className="text-xs text-muted-foreground">
                  {t("detail-progress", {
                    done,
                    total: REVIEW_SECTIONS.length
                  })}
                </span>
              </div>
            </Frame>
            {definition
              ? REVIEW_SECTIONS.map((section) => (
                  <Frame
                    key={section}
                    title={t(`sec-${section}`)}
                    description={t(`sec-${section}-desc`)}
                    action={
                      reviewer ? (
                        <Select
                          items={MARK_OPTIONS.map((value) => ({
                            value,
                            label: markLabel(value)
                          }))}
                          value={marks[section] ?? "pending"}
                          onValueChange={(value) =>
                            value &&
                            setMarks((current) => ({
                              ...current,
                              [section]: value === "pending" ? null : (value as SectionVerdict)
                            }))
                          }
                        >
                          <SelectTrigger className="min-w-36" aria-label={t(`sec-${section}`)}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent align="end" alignItemWithTrigger={false}>
                            <SelectGroup>
                              {MARK_OPTIONS.map((value) => (
                                <SelectItem key={value} value={value}>
                                  {markLabel(value)}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      ) : undefined
                    }
                  >
                    <div className={cn(marks[section] === "fix" && "rounded-[10px] ring-1 ring-destructive/40")}>
                      <StaffReviewSection section={section} definition={definition} assets={detail.assets} />
                    </div>
                  </Frame>
                ))
              : null}
            <SubmissionChanges revisions={detail.revisions} />
            <SubmissionFiles files={detail.files} />
          </div>
          <div className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-6 xl:self-start">
            {reviewer && choice ? (
              <Frame
                title={t("detail-decision")}
                description={t("detail-decision-description")}
                footer={
                  <>
                    <span className="text-xs text-muted-foreground">{flagged > 0 ? t("detail-flagged", { count: flagged }) : (error ?? "")}</span>
                    <Button variant={choice === "reject" ? "destructive" : "default"} disabled={busy || !canSubmit} onClick={() => decide(choice)}>
                      {t("detail-submit")}
                    </Button>
                  </>
                }
              >
                <RadioGroup value={choice} onValueChange={(value) => setVerdict(value as DecisionVerdict)} aria-label={t("detail-decision")}>
                  {decisions.map((value) => (
                    <label key={value} className="flex cursor-pointer items-start gap-3 text-sm">
                      <RadioGroupItem value={value} className="mt-0.5" />
                      <span className="flex flex-col">
                        <span className="font-medium text-foreground">{t(`decision-${value}`)}</span>
                        <span className="text-xs text-muted-foreground">{t(`decision-${value}-hint`)}</span>
                      </span>
                    </label>
                  ))}
                </RadioGroup>
                <Textarea
                  value={message}
                  disabled={busy}
                  placeholder={t("peek-message-placeholder")}
                  aria-label={t("peek-message-placeholder")}
                  onChange={(event) => setMessage(event.target.value)}
                />
              </Frame>
            ) : null}
            {canPublish ? (
              <Frame
                title={t("publish-title")}
                description={t("publish-description")}
                action={
                  confirmPublish ? undefined : (
                    <Button variant="secondary" disabled={busy} onClick={() => setConfirmPublish(true)}>
                      {sub("publish")}
                    </Button>
                  )
                }
              >
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
                ) : null}
              </Frame>
            ) : null}
            <SubmissionThread detail={detail} />
          </div>
        </div>
      ) : null}
    </>
  );
};
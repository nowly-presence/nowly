"use client";

import { Frame } from "@/features/shell/components/frame";
import type { FieldComment, ReviewVerdict } from "@/features/account/lib/submission-api";
import { FIELD_COMMENT_FIELD_MAX_LENGTH, FIELD_COMMENT_MAX_LENGTH, FIELD_COMMENT_PAGE_MAX_LENGTH, REVIEW_MESSAGE_MAX_LENGTH, reviewIsValid } from "@nowly/presence-creator/creator-submission-policy";
import { Button, Input, Textarea } from "@nowly/ui";
import { RiAddLine, RiCloseLine } from "@nowly/ui/icons";
import { useTranslations } from "next-intl";
import { useState } from "react";

const VERDICTS: readonly ReviewVerdict[] = ["comment", "approve", "request_changes", "reject"];
const FIELD_SUGGESTIONS = [
  "name",
  "domains",
  "color",
  "category",
  "description",
  "longDescription",
  "features",
  "page.details",
  "page.state",
  "page.button",
  "page.match",
  "images"
];

export const SubmissionReviewForm = ({ allowedVerdicts, busy, error, onSubmit }: {
  allowedVerdicts: readonly ReviewVerdict[];
  busy: boolean;
  error: string | null;
  onSubmit: (review: { verdict: ReviewVerdict; message: string; comments: FieldComment[] }) => Promise<boolean>;
}) => {
  const t = useTranslations("submissionPage");
  const options = VERDICTS.filter((verdict) => allowedVerdicts.includes(verdict));

  const [verdict, setVerdict] = useState<ReviewVerdict>(options[0] ?? "comment");
  const [message, setMessage] = useState("");
  const [comments, setComments] = useState<FieldComment[]>([]);
  const trimmed = message.trim();
  const readyComments = comments.filter((comment) => comment.field.trim() && comment.message.trim());

  const valid = reviewIsValid(verdict, trimmed, readyComments.length);

  const updateComment = (index: number, patch: Partial<FieldComment>) =>
    setComments((current) => current.map((comment, position) => (position === index ? { ...comment, ...patch } : comment)));

  const submit = async (): Promise<void> => {
    const sent = await onSubmit({
      verdict,
      message: trimmed,
      comments: readyComments.map((comment) => ({
        field: comment.field.trim(),
        ...(comment.page?.trim() ? { page: comment.page.trim() } : {}),
        message: comment.message.trim()
      }))
    });

    if (!sent) return;

    setMessage("");
    setComments([]);
  };

  return (
    <Frame title={t("review-title")} description={t("review-description")}>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t("review-verdict")}>
        {options.map((option) => (
          <Button
            key={option}
            size="sm"
            variant={verdict === option ? "default" : "outline"}
            aria-pressed={verdict === option}
            disabled={busy}
            onClick={() => setVerdict(option)}
          >
            {t(`verdict-${option}`)}
          </Button>
        ))}
      </div>

      <Textarea
        className="mt-4"
        value={message}
        maxLength={REVIEW_MESSAGE_MAX_LENGTH}
        disabled={busy}
        placeholder={t("review-message")}
        aria-label={t("review-message")}
        onChange={(event) => setMessage(event.target.value)}
      />

      <datalist id="submission-review-fields">
        {FIELD_SUGGESTIONS.map((field) => (
          <option key={field} value={field} />
        ))}
      </datalist>
      <ul className="mt-4 flex flex-col gap-3">
        {comments.map((comment, index) => (
          <li key={index} className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              <Input
                value={comment.field}
                maxLength={FIELD_COMMENT_FIELD_MAX_LENGTH}
                list="submission-review-fields"
                placeholder={t("comment-field")}
                aria-label={t("comment-field")}
                disabled={busy}
                onChange={(event) => updateComment(index, { field: event.target.value })}
              />
              <Input
                value={comment.page ?? ""}
                maxLength={FIELD_COMMENT_PAGE_MAX_LENGTH}
                placeholder={t("comment-page")}
                aria-label={t("comment-page")}
                disabled={busy}
                onChange={(event) => updateComment(index, { page: event.target.value })}
              />
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={t("comment-remove")}
                disabled={busy}
                onClick={() => setComments((current) => current.filter((_, position) => position !== index))}
              >
                <RiCloseLine />
              </Button>
            </div>
            <Textarea
              value={comment.message}
              maxLength={FIELD_COMMENT_MAX_LENGTH}
              placeholder={t("comment-message")}
              aria-label={t("comment-message")}
              disabled={busy}
              onChange={(event) => updateComment(index, { message: event.target.value })}
            />
          </li>
        ))}
      </ul>
      <Button
        className="mt-3"
        size="sm"
        variant="ghost"
        disabled={busy}
        onClick={() =>
          setComments((current) => [
            ...current,
            {
              field: "",
              message: ""
            }
          ])
        }
      >
        <RiAddLine data-icon="inline-start" />
        {t("comment-add")}
      </Button>

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

      <div className="mt-4">
        <Button disabled={busy || !valid} onClick={() => void submit()}>
          {t("review-send")}
        </Button>
      </div>
    </Frame>
  );
};
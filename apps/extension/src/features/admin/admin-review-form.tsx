import { useEffect, useState } from "react";
import { RiAddLine, RiCloseLine, RiSendPlaneLine } from "@remixicon/react";
import { useI18n } from "@/hooks/i18n-provider";
import { COMMENT_FIELDS, commentTarget, fieldKey, needsPage } from "@/lib/review-fields";
import { sendMessage } from "@/lib/messages";
import type { FieldComment, ReviewVerdict, SubmissionDetail } from "@/shared/admin/admin-types";
import { allowedVerdicts, reviewIsValid } from "@nowly/presence-creator/creator-submission-policy";
import { verdictLabelKey } from "@/components/shared/review-thread";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { Field } from "@/ui/field";
import { Select } from "@/ui/select";
import { Textarea } from "@/ui/textarea";
import { useToast } from "@/ui/toast";
import { adminErrorKey } from "@/lib/admin-error";

export type CommentTarget = {
  field: string;
  page?: string;
  nonce: number;
};

const COMMENT_MAX_LENGTH = 1_000;
const MESSAGE_MAX_LENGTH = 2_000;

export const AdminReviewForm = ({ detail, target, onDone }: {
  detail: SubmissionDetail;
  target: CommentTarget | null;
  onDone: () => void;
}) => {
  const { t } = useI18n();
  const { toast } = useToast();
  const verdicts = allowedVerdicts(detail.status);
  const pages = detail.definition?.pages.map((page) => page.name) ?? [];
  const [verdict, setVerdict] = useState<ReviewVerdict>(verdicts[0] ?? "comment");
  const [message, setMessage] = useState("");
  const [comments, setComments] = useState<FieldComment[]>([]);
  const [field, setField] = useState(COMMENT_FIELDS[0]);
  const [page, setPage] = useState(pages[0] ?? "");
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;

    setField(COMMENT_FIELDS.includes(target.field) ? target.field : COMMENT_FIELDS[0]);
    if (target.page) setPage(target.page);
  }, [target]);

  if (verdicts.length === 0) return null;

  const addComment = () => {
    const trimmed = commentText.trim();

    if (!trimmed) return;

    setComments((current) => [
      ...current,
      {
        field,
        page: needsPage(field) && page ? page : undefined,
        message: trimmed
      }
    ]);
    setCommentText("");
  };

  const send = async () => {
    setSending(true);
    setError(null);
    const result = await sendMessage("ADMIN_REVIEW", {
      id: detail.id,
      revision: detail.revision,
      verdict,
      message: message.trim(),
      comments
    });
    setSending(false);

    if (!result.ok) {
      setError(result.message ?? t(adminErrorKey(result.error)));
      return;
    }

    toast(t("admin.review.sent"), "success");
    setMessage("");
    setComments([]);
    onDone();
  };

  return (
    <Card className="flex flex-col gap-4 p-4">
      <Field label={t("admin.review.verdict")}>
        <Select
          aria-label={t("admin.review.verdict")}
          value={verdict}
          options={verdicts.map((value) => ({
            value,
            label: t(verdictLabelKey(value))
          }))}
          onChange={(value) => setVerdict(verdicts.find((entry) => entry === value) ?? verdict)}
        />
      </Field>
      <Field label={t("admin.review.message")}>
        <Textarea
          value={message}
          maxLength={MESSAGE_MAX_LENGTH}
          placeholder={t("admin.review.messagePlaceholder")}
          onChange={(event) => setMessage(event.target.value)}
        />
      </Field>

      <div className="flex flex-col gap-3 border-t border-line pt-3">
        <span className="text-label-lg font-medium">{t("admin.review.fieldComments")}</span>
        {comments.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {comments.map((comment, index) => (
              <li key={`${comment.field}:${comment.page ?? ""}:${index}`} className="flex items-start gap-2 rounded-md bg-hover p-2 text-label-md">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium">{commentTarget(comment, t)}</span>
                  <span className="text-muted">{comment.message}</span>
                </span>
                <button
                  type="button"
                  aria-label={t("admin.review.removeComment")}
                  onClick={() => setComments((current) => current.filter((_, position) => position !== index))}
                  className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted hover:text-danger"
                >
                  <RiCloseLine className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <Select
          aria-label={t("admin.review.field")}
          value={field}
          options={COMMENT_FIELDS.map((value) => ({
            value,
            label: fieldKey(value) ? t(fieldKey(value) ?? "submissionReview.field.definition") : value
          }))}
          onChange={setField}
        />
        {needsPage(field) && pages.length > 0 && (
          <Select
            aria-label={t("admin.review.page")}
            value={page}
            options={pages.map((name) => ({
              value: name,
              label: name
            }))}
            onChange={setPage}
          />
        )}
        <Textarea
          value={commentText}
          maxLength={COMMENT_MAX_LENGTH}
          aria-label={t("admin.review.commentPlaceholder")}
          placeholder={t("admin.review.commentPlaceholder")}
          className="min-h-20"
          onChange={(event) => setCommentText(event.target.value)}
        />
        <Button size="sm" variant="secondary" icon={<RiAddLine className="size-4" />} disabled={!commentText.trim()} onClick={addComment}>
          {t("admin.review.addComment")}
        </Button>
      </div>

      {error && <p className="text-label-md text-danger">{error}</p>}
      <Button
        icon={<RiSendPlaneLine className="size-4" />}
        loading={sending}
        disabled={!reviewIsValid(verdict, message, comments.length)}
        onClick={() => void send()}
      >
        {t("admin.review.send")}
      </Button>
    </Card>
  );
};
import { RiChat3Line, RiExternalLinkLine } from "@remixicon/react";
import { useI18n, type MessageKey } from "@/hooks/i18n-provider";
import type { CreatorFieldChange } from "@nowly/presence-creator/creator-diff";
import { commentTarget } from "@/lib/review-fields";
import { openUrl } from "@/shared/browser-links";
import type { SubmissionDetail } from "@/shared/admin/admin-types";
import { textIn } from "@nowly/presence-creator/creator-draft";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { Section } from "@/ui/section";
import { SUBMISSION_TONES, submissionStatusKey } from "@/lib/submission-status";

const CHANGE_KEYS: Record<CreatorFieldChange["kind"], MessageKey> = {
  added: "admin.change.added",
  removed: "admin.change.removed",
  changed: "admin.change.changed"
};

export const AdminSubmissionSummary = ({ detail, onComment }: {
  detail: SubmissionDetail;
  onComment: (field: string, page?: string) => void;
}) => {
  const { t } = useI18n();
  const { definition } = detail;
  const changes = detail.revisions.find((revision) => revision.number === detail.revision)?.changes ?? [];

  return (
    <>
      <Card className="flex flex-col gap-3 p-4">
        {detail.assets.thumbnail && <img src={detail.assets.thumbnail} alt="" className="aspect-video w-full rounded-md object-cover" />}
        <div className="flex items-center gap-3">
          {detail.assets.icon && <img src={detail.assets.icon} alt="" className="size-10 rounded-md" />}
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-label-lg font-medium">{definition?.name ?? detail.slug}</span>
            <span className="truncate text-label-md text-muted">{t("admin.by", { name: detail.author?.name ?? t("admin.unknownAuthor") })}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={SUBMISSION_TONES[detail.status]}>{t(submissionStatusKey(detail.status))}</Badge>
          <Badge tone="outline">{t(detail.kind === "update" ? "admin.kindUpdate" : "admin.kindCreate")}</Badge>
          <Badge tone="outline">{t("submissionReview.revision", { number: detail.revision })}</Badge>
        </div>
        {definition && (
          <dl className="flex flex-col gap-2 text-label-md">
            <div>
              <dt className="text-muted">{t("submissionReview.field.domains")}</dt>
              <dd>{definition.domains.join(", ")}</dd>
            </div>
            <div>
              <dt className="text-muted">{t("submissionReview.field.description")}</dt>
              <dd>{textIn(definition.description, definition.baseLocale)}</dd>
            </div>
            {definition.pages.map((page) => (
              <div key={page.id}>
                <dt className="text-muted">{page.name}</dt>
                <dd>{textIn(page.details, definition.baseLocale)}</dd>
              </div>
            ))}
          </dl>
        )}
        {detail.prUrl && (
          <Button size="sm" variant="secondary" icon={<RiExternalLinkLine className="size-4" />} onClick={() => detail.prUrl && openUrl(detail.prUrl)}>
            {t("creator.submit.pullRequest")}
          </Button>
        )}
      </Card>

      <Section title={t("admin.review.changes")}>
        {changes.length === 0 ? (
          <p className="px-1 text-label-md text-muted">{t("admin.review.noChanges")}</p>
        ) : (
          <Card className="flex flex-col divide-y divide-line p-0">
            {changes.map((change, index) => (
              <div key={`${change.field}:${change.page ?? ""}:${index}`} className="flex items-center gap-2 px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-label-md">{commentTarget(change, t)}</span>
                <Badge tone={change.kind === "removed" ? "danger" : change.kind === "added" ? "success" : "neutral"}>{t(CHANGE_KEYS[change.kind])}</Badge>
                <button
                  type="button"
                  aria-label={t("admin.review.commentOn")}
                  onClick={() => onComment(change.field, change.page)}
                  className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-hover hover:text-ink"
                >
                  <RiChat3Line className="size-4" />
                </button>
              </div>
            ))}
          </Card>
        )}
      </Section>
    </>
  );
};
"use client";

import { SubmissionStatusBadge } from "@/features/account/components/submission-status-badge";
import {
  fetchSubmission,
  sendReview,
  type QueueItem,
  type ReviewVerdict,
  type SubmissionDetail
} from "@/features/account/lib/submission-api";
import { Frame } from "@/features/shell/components/frame";
import { allowedVerdicts } from "@/features/account/lib/submission-text";
import { staffSubmissionHref } from "@/features/staff/lib/staff-nav";
import { Link } from "@/i18n/navigation";
import { Badge, Button, Textarea } from "@nowly/ui";
import { buttonVariants } from "@nowly/ui/button-variants";
import { cn } from "@nowly/ui/utils";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type QuickVerdict = Extract<ReviewVerdict, "request_changes" | "reject">;

const MAX_CHANGES = 6;

export const StaffPeekPanel = ({ item, onChanged }: {
  item: QueueItem | null;
  onChanged: () => void;
}) => {
  const t = useTranslations("staff");
  const account = useTranslations("accountPage");
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [staged, setStaged] = useState<QuickVerdict | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const itemId = item?.id ?? null;

  useEffect(() => {
    setDetail(null);
    setFailed(false);
    setStaged(null);
    setMessage("");

    if (!itemId) return;

    fetchSubmission(itemId)
      .then(setDetail)
      .catch(() => setFailed(true));
  }, [itemId]);

  if (!item) return (
    <div className="w-full shrink-0 rounded-[16px] bg-foreground/4 p-4 ring-1 ring-foreground/10 xl:w-88">
      <p className="text-sm text-muted-foreground">{t("peek-empty")}</p>
    </div>
  );

  const verdicts = allowedVerdicts(item.status);
  const latest = detail?.revisions.at(-1) ?? null;
  const checks: Array<{ key: string; ok: boolean }> = detail
    ? [
        { key: "check-pr", ok: Boolean(detail.pullRequest.url) && !detail.pullRequest.error },
        { key: "check-files", ok: detail.files.length > 0 },
        { key: "check-images", ok: Object.keys(detail.assets).length > 0 }
      ]
    : [];

  const onConfirm = (): void => {
    if (!staged || message.trim().length === 0) return;

    setBusy(true);
    sendReview(item.id, { revision: item.revision, verdict: staged, message: message.trim(), comments: [] })
      .then(() => {
        setStaged(null);
        setMessage("");
        onChanged();
      })
      .catch(() => setFailed(true))
      .finally(() => setBusy(false));
  };

  return (
    <Frame
      className="w-full shrink-0 xl:sticky xl:top-6 xl:w-88"
      title={item.name}
      description={[item.kind === "update" ? account("kind-update") : account("kind-create"), item.author ? account("by-author", { name: item.author.name ?? "" }) : null, account("revision-label", { number: item.revision })].filter(Boolean).join(", ")}
      action={<SubmissionStatusBadge status={item.status} />}
      footer={
        staged ? (
          <>
            <Button variant="ghost" disabled={busy} onClick={() => setStaged(null)}>
              {t("peek-cancel")}
            </Button>
            <Button variant={staged === "reject" ? "destructive" : "default"} disabled={busy || message.trim().length === 0} onClick={onConfirm}>
              {t("peek-confirm")}
            </Button>
          </>
        ) : (
          <div className="flex w-full flex-wrap gap-2">
            <Link href={staffSubmissionHref(item.id)} className={cn(buttonVariants(), "w-full")}>
              {t("peek-open")}
            </Link>
            {verdicts.includes("request_changes") ? (
              <Button variant="outline" className="flex-1" onClick={() => setStaged("request_changes")}>
                {t("peek-request")}
              </Button>
            ) : null}
            {verdicts.includes("reject") ? (
              <Button variant="destructive" className="flex-1" onClick={() => setStaged("reject")}>
                {t("peek-reject")}
              </Button>
            ) : null}
          </div>
        )
      }
    >
      {failed ? <p className="text-sm text-destructive">{t("error")}</p> : null}
      {!detail && !failed ? <p className="text-sm text-muted-foreground">{t("loading")}</p> : null}
      {detail ? (
        <>
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-medium text-muted-foreground">{t("peek-changes")}</h3>
            {!latest || latest.changes.length === 0 ? <p className="text-sm text-muted-foreground">{t("peek-no-changes")}</p> : null}
            <ul className="flex flex-col gap-1.5">
              {latest?.changes.slice(0, MAX_CHANGES).map((change) => (
                <li key={`${change.page ?? ""}-${change.field}-${change.kind}`} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-foreground">{[change.page, change.field].filter(Boolean).join(" / ")}</span>
                  <Badge variant={change.kind === "removed" ? "destructive" : "secondary"}>{t(`change-${change.kind}`)}</Badge>
                </li>
              ))}
            </ul>
            {latest && latest.changes.length > MAX_CHANGES ? <p className="text-xs text-muted-foreground">{t("peek-more", { count: latest.changes.length - MAX_CHANGES })}</p> : null}
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-medium text-muted-foreground">{t("peek-checks")}</h3>
            <ul className="flex flex-col gap-1.5">
              {checks.map((check) => (
                <li key={check.key} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{t(check.key)}</span>
                  <Badge variant={check.ok ? "secondary" : "destructive"}>{check.ok ? t("check-ok") : t("check-missing")}</Badge>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
      {staged ? <Textarea value={message} placeholder={t("peek-message-placeholder")} aria-label={t("peek-message-placeholder")} onChange={(event) => setMessage(event.target.value)} /> : null}
    </Frame>
  );
};

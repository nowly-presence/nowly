import { useEffect, useMemo, useState } from "react";
import { RiDiscordFill, RiExternalLinkLine, RiRefreshLine, RiSendPlaneLine } from "@remixicon/react";
import { useI18n, type MessageKey } from "@/hooks/i18n-provider";
import { sendMessage } from "@/lib/messages";
import { openUrl } from "@/shared/browser-links";
import { buildTextFiles, creatorDefinition } from "@nowly/presence-creator/creator-export";
import { presenceSlug } from "@nowly/presence-creator/creator-draft";
import { authorFromAccount, canEditSubmission, sameAuthor, type CreatorSubmitError } from "@nowly/presence-creator/creator-submission";
import type { CreatorDraft, CreatorSubmission, SubmissionStatus } from "@nowly/presence-creator/creator-types";
import { useCreatorPresenceProbe } from "@/hooks/use-creator-presence-probe";
import { useStaffAccess } from "@/hooks/use-staff-access";
import { useSubmissionDetail } from "@/hooks/use-submission-detail";
import { canPublish } from "@/shared/admin/review-rules";
import { adminErrorKey } from "@/lib/admin-error";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { creatorSignature } from "@/shared/creator/creator-signature";
import { SubmissionFeedback } from "@/features/creator/review/submission-feedback";
import { useCreatorAccount } from "@/features/creator/use-creator-account";
import type { DraftUpdate } from "@/features/creator/use-draft-editor";

const PENDING_STATUSES: readonly SubmissionStatus[] = ["submitted", "approved", "in_progress"];

const SUBMIT_ERROR_KEYS: Record<CreatorSubmitError, MessageKey> = {
  UNAUTHORIZED: "creator.submit.errorUnauthorized",
  CREATOR_REQUIRED: "creator.submit.errorUnauthorized",
  UNAVAILABLE: "creator.submit.errorUnavailable",
  INVALID: "creator.submit.errorInvalid",
  NETWORK: "creator.submit.errorNetwork"
};

export const SubmitPanel = ({ draft, update, blocked }: {
  draft: CreatorDraft;
  update: DraftUpdate;
  blocked: boolean;
}) => {
  const { t } = useI18n();
  const { account, connecting, connect, refresh } = useCreatorAccount();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submission = draft.submission;
  const staff = useStaffAccess();
  const published = useCreatorPresenceProbe(presenceSlug(draft.name), staff.can("review"));
  const publishing = published && staff.can("publish");
  const thread = useSubmissionDetail(submission?.id ?? null);

  const ready = Boolean(account?.creator);
  const pending = submission ? PENDING_STATUSES.includes(submission.status) : false;
  const signature = useMemo(() => (submission ? creatorSignature(draft) : ""), [draft, submission]);
  const unchanged = Boolean(submission) && draft.sentSignature === signature;

  useEffect(() => {
    if (!account?.creator) return;

    const author = authorFromAccount(account);
    update((current) => (sameAuthor(current.author, author) ? current : { ...current, author }));
  }, [account, update]);

  const refreshStatus = async () => {
    if (!submission) return;

    const [latest] = await sendMessage("CREATOR_FETCH_SUBMISSIONS", {
      ids: [submission.id]
    });
    if (latest) update({ submission: latest });
    await thread.reload();
  };

  const publishNow = async (target: CreatorSubmission) => {
    const result = await sendMessage("ADMIN_PUBLISH", {
      id: target.id,
      revision: target.revision ?? 1
    });

    if (result.ok) update({ submission: result.data });
    else setError(result.message ?? t(adminErrorKey(result.error)));

    return result.ok;
  };

  const publishExisting = async () => {
    if (!submission) return;

    setSending(true);
    setError(null);
    await publishNow(submission);
    setSending(false);
    await thread.reload();
  };

  const submit = async () => {
    const { logo, icon, thumbnail } = draft.assets;

    if (!logo || !icon || !thumbnail) return;

    setSending(true);
    setError(null);
    const result = await sendMessage("CREATOR_SUBMIT", {
      definition: creatorDefinition(draft),
      translate: draft.translationMode === "auto",
      files: buildTextFiles(draft),
      assets: {
        logo,
        icon,
        thumbnail,
        thumbnailRightsConfirmed: draft.assets.thumbnailRightsConfirmed
      }
    });
    setSending(false);

    if (result.ok) {
      update({
        submission: result.submission,
        sentSignature: signature
      });
      if (publishing) await publishNow(result.submission);
      await thread.reload();
    } else {
      if (result.error === "CREATOR_REQUIRED" || result.error === "UNAUTHORIZED") void refresh();
      if (result.error !== "UNAUTHORIZED") setError(result.message ?? t(SUBMIT_ERROR_KEYS[result.error]));
    }
  };

  if (!ready && canEditSubmission(submission)) {
    return (
      <Card className="flex flex-col gap-3 p-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-label-lg font-medium">{t(account ? "creator.submit.permissionTitle" : "creator.submit.signInTitle")}</span>
          <span className="text-label-md text-muted">{t(account ? "creator.submit.permissionHint" : "creator.submit.signInHint")}</span>
        </div>
        <Button variant="solid" icon={<RiDiscordFill className="size-4" />} loading={connecting} onClick={() => void connect()}>
          {t(account ? "creator.submit.allow" : "creator.submit.discord")}
        </Button>
      </Card>
    );
  }

  const sendLabel: MessageKey = publishing
    ? "creator.submit.publish"
    : published
      ? "creator.submit.propose"
      : submission
        ? "creator.submit.resend"
        : "creator.submit.send";

  return (
    <Card className="flex flex-col gap-4 p-4">
      {account && (
        <div className="flex items-center gap-3">
          {account.user.image ? (
            <img src={account.user.image} alt="" className="size-9 rounded-full" />
          ) : (
            <span className="flex size-9 items-center justify-center rounded-full bg-hover text-label-lg">{account.user.name.charAt(0)}</span>
          )}
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-label-lg font-medium">{account.user.name}</span>
            <span className="text-label-md text-muted">{t("creator.submit.viaDiscord")}</span>
          </div>
        </div>
      )}

      {submission && (
        <div className="flex flex-col gap-3 border-t border-line pt-3">
          <SubmissionFeedback submission={submission} reviews={thread.detail?.reviews ?? []} actionable={canEditSubmission(submission)} />
          {(pending || publishing || submission.prUrl) && (
            <div className="flex flex-wrap gap-2">
              {pending && (
                <Button size="sm" variant="secondary" icon={<RiRefreshLine className="size-4" />} onClick={() => void refreshStatus()}>
                  {t("creator.submit.refresh")}
                </Button>
              )}
              {publishing && canPublish(submission.status) && (
                <Button size="sm" loading={sending} onClick={() => void publishExisting()}>
                  {t("creator.submit.publishNow")}
                </Button>
              )}
              {submission.prUrl && (
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<RiExternalLinkLine className="size-4" />}
                  onClick={() => submission.prUrl && openUrl(submission.prUrl)}
                >
                  {t("creator.submit.pullRequest")}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {canEditSubmission(submission) && (
        <>
          {blocked && <p className="text-label-md text-muted">{t("creator.submit.blocked")}</p>}
          <p className="text-label-sm text-muted">
            {draft.translationMode === "auto"
              ? t("creator.submit.autoTranslate")
              : t("creator.submit.manualTranslate")}
          </p>
          {error && <p className="text-label-md text-danger">{error}</p>}
          {unchanged && !blocked && <p className="text-label-md text-muted">{t("creator.submit.unchanged")}</p>}
          <Button icon={<RiSendPlaneLine className="size-4" />} loading={sending} disabled={blocked || unchanged} onClick={() => void submit()}>
            {t(sendLabel)}
          </Button>
        </>
      )}
    </Card>
  );
};
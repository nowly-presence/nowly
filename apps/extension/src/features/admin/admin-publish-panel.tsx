import { useState } from "react";
import { RiRocketLine } from "@remixicon/react";
import { useI18n } from "@/hooks/i18n-provider";
import { sendMessage } from "@/lib/messages";
import type { AdminResult, SubmissionDetail } from "@/shared/admin/admin-types";
import { canPublish } from "@/shared/admin/review-rules";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { Sheet } from "@/ui/sheet";
import { useToast } from "@/ui/toast";
import { adminErrorKey } from "@/lib/admin-error";

export const AdminPublishPanel = ({ detail, onDone }: {
  detail: SubmissionDetail;
  onDone: () => void;
}) => {
  const { t } = useI18n();
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const publishable = canPublish(detail.status);
  const retryable = detail.status === "in_progress";

  if (!publishable && !retryable) return null;

  const run = async (action: () => Promise<AdminResult<unknown>>) => {
    setBusy(true);
    setError(null);
    const result = await action();
    setBusy(false);
    setConfirming(false);

    if (!result.ok) {
      setError(result.message ?? t(adminErrorKey(result.error)));
      return;
    }

    toast(t("admin.publish.done"), "success");
    onDone();
  };

  return (
    <Card className="flex flex-col gap-3 p-4">
      {detail.prError && <p className="text-label-md text-danger">{t("admin.publish.prError", { error: detail.prError })}</p>}
      {error && <p className="text-label-md text-danger">{error}</p>}
      {publishable && (
        <>
          {detail.status === "submitted" && <p className="text-label-md text-muted">{t("admin.publish.withoutReview")}</p>}
          <Button icon={<RiRocketLine className="size-4" />} loading={busy} onClick={() => setConfirming(true)}>
            {t("admin.publish.action")}
          </Button>
        </>
      )}
      {retryable && (
        <Button variant="secondary" loading={busy} onClick={() => void run(() => sendMessage("ADMIN_RETRY_PULL_REQUEST", { id: detail.id }))}>
          {t("admin.publish.retry")}
        </Button>
      )}
      <Sheet
        open={confirming}
        onClose={() => setConfirming(false)}
        title={t("admin.publish.confirmTitle", { name: detail.definition?.name ?? detail.slug })}
        description={t(detail.status === "submitted" ? "admin.publish.confirmUnreviewed" : "admin.publish.confirmDescription")}
        closeLabel={t("action.close")}
        footer={
          <>
            <Button variant="secondary" className="flex-1" onClick={() => setConfirming(false)}>
              {t("action.cancel")}
            </Button>
            <Button
              className="flex-1"
              loading={busy}
              onClick={() =>
                void run(() =>
                  sendMessage("ADMIN_PUBLISH", {
                    id: detail.id,
                    revision: detail.revision
                  })
                )
              }
            >
              {t("admin.publish.action")}
            </Button>
          </>
        }
      />
    </Card>
  );
};
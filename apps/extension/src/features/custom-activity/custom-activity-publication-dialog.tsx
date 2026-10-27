import { RiDiscordFill, RiExternalLinkLine } from "@remixicon/react";
import { useI18n } from "@/hooks/i18n-provider";
import { Button } from "@/ui/button";
import { ButtonGroup } from "@/ui/button-group";
import { Input } from "@/ui/input";
import { useToast } from "@/ui/toast";
import { Sheet } from "@/ui/sheet";
import { useCustomActivityPublication } from "@/features/custom-activity/custom-activity-publication-hook";
import { CustomActivityPublicationPreview } from "@/features/custom-activity/custom-activity-publication-preview";

export const CustomActivityPublicationDialog = ({ id, onClose }: {
  id: string;
  onClose: () => void;
}) => {
  const { t } = useI18n();
  const { toast } = useToast();
  const { busy, url, error, published, creatorRequired, revision, hasChanges, publish, connect } = useCustomActivityPublication(id);
  const withdraw = async () => {
    if (!(await publish(true))) return;

    onClose();
    toast(t("custom.public.unpublished"));
  };
  const copy = async () => {
    if (!url || !published) return;

    try {
      await navigator.clipboard.writeText(url);
      toast(t("toast.copied"));
    } catch {
      toast(t("error.generic"), "error");
    }
  };
  return (
    <Sheet
      open
      onClose={onClose}
      hideTitle={creatorRequired}
      title={t(creatorRequired ? "custom.public.connect" : published ? "custom.public.updateTitle" : "custom.public.share")}
      description={creatorRequired ? undefined : t(published ? "custom.public.updateHint" : "custom.public.invitation")}
      closeLabel={t("action.close")}
    >
      <div className="flex flex-col gap-5 pb-2" data-testid="custom-publication">
        {creatorRequired ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-xl bg-hover">
              <RiDiscordFill className="size-7.5 text-muted" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-headline-sm font-medium text-ink">{t("custom.public.connect")}</h2>
              <p className="text-body-sm text-muted">{t("custom.public.connectHint")}</p>
            </div>
            <Button className="mt-2 w-full" loading={busy} onClick={() => void connect()}>
              {t("custom.public.connect")}
            </Button>
          </div>
        ) : (
          <>
            <CustomActivityPublicationPreview id={id} creatorRequired={creatorRequired} />
            {url && published && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <Input aria-label={t("custom.public.title")} value={url} readOnly className="min-w-0 w-full" />
                  </div>
                  <ButtonGroup label={t("custom.public.title")}>
                    <Button variant="ghost" onClick={() => void copy()}>
                      {t("custom.public.copy")}
                    </Button>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={t("custom.public.open")}
                      title={t("custom.public.open")}
                      className="inline-flex size-9 shrink-0 items-center justify-center text-ink transition-colors hover:bg-hover active:bg-press"
                    >
                      <RiExternalLinkLine aria-hidden="true" />
                    </a>
                  </ButtonGroup>
                </div>
              </div>
            )}
            {url && !published && <p className="text-body-sm text-muted">{t("custom.public.unpublished")}</p>}
            <div className="flex w-full flex-col gap-3">
              <Button className="w-full" disabled={revision === null || (published && hasChanges !== true)} loading={busy} onClick={() => void publish()}>
                {t(published ? "custom.public.update" : "custom.public.publish")}
              </Button>
              {url && !creatorRequired && (
                <Button variant="secondary" className="w-full" disabled={revision === null} loading={busy} onClick={() => void withdraw()}>
                  {t("custom.public.unpublish")}
                </Button>
              )}
            </div>
          </>
        )}
        {error && (
          <p role="alert" className="text-body-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </Sheet>
  );
};
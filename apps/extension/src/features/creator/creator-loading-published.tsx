import { BackHeader, ScreenBody } from "@/components/shared/screen";
import { useI18n } from "@/hooks/i18n-provider";
import { Button } from "@/ui/button";
import { Skeleton } from "@/ui/skeleton";
import { adminErrorKey } from "@/lib/admin-error";
import type { PublishedPresenceLoader } from "@/features/creator/use-published-presence-loader";

export const CreatorLoadingPublished = ({ loader, onBack }: {
  loader: PublishedPresenceLoader;
  onBack: () => void;
}) => {
  const { t } = useI18n();
  return (
    <div className="flex min-h-full flex-col">
      <BackHeader title={t("creator.title")} onBack={onBack} backLabel={t("action.back")} />
      <ScreenBody className="pt-0">
        {loader.error ? (
          <div className="flex flex-col gap-3">
            <p className="text-body-sm text-danger">{t("creator.published.error")}</p>
            <p className="text-label-md text-muted">{t(adminErrorKey(loader.error))}</p>
            <Button variant="secondary" onClick={loader.retry}>
              {t("creator.published.retry")}
            </Button>
          </div>
        ) : (
          <div aria-busy="true" className="flex flex-col gap-3">
            <p className="text-body-sm text-muted">{t("creator.published.loading")}</p>
            <Skeleton className="h-24" />
          </div>
        )}
      </ScreenBody>
    </div>
  );
};
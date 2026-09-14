import { Button } from "@/components/ui/button";
import { PresenceAboutCard } from "@/features/presences/presence-detail-info";
import { storeCategoryLabel, type StorePresence } from "@/features/store/store.model";
import { VersionBadge } from "@/components/shared/version-badge";
import { assetUrl } from "@/shared/api";
import { t } from "@/shared/i18n";
import { IconChevronLeft, IconLoader2 } from "@/lib/tabler-icons";
import type { FC, ReactElement } from "react";

type StoreAction = "install" | "update" | "installed";

type Props = {
  action: StoreAction;
  installing: boolean;
  onBack: () => void;
  onInstall: (slug: string) => void;
  presence: StorePresence;
};

export const StoreDetail: FC<Props> = ({
  action,
  installing,
  onBack,
  onInstall,
  presence,
}): ReactElement => {
  const category = storeCategoryLabel(presence.category);

  const label =
    action === "installed"
      ? t("store-installed")
      : action === "update"
        ? t("store-update")
        : t("store-install");

  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="unstyled"
        size="none"
        onClick={onBack}
        className="-ml-1 inline-flex h-8 w-fit items-center gap-1 rounded-lg px-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <IconChevronLeft className="size-4" />
        {t("back")}
      </Button>

      <section
        className="overflow-hidden rounded-xl border border-border bg-card"
        style={{ backgroundImage: `radial-gradient(140px 90px at 32px 32px, ${presence.color}20, transparent 70%)` }}
      >
        <div className="flex items-start gap-3 p-4">
          <div
            className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl"
            style={{ backgroundColor: `${presence.color}20` }}
          >
            <img src={assetUrl(presence.slug, "icon")} alt="" className="size-7 object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="min-w-0 truncate text-base font-semibold text-foreground">{presence.name}</h1>
              {presence.version ? <VersionBadge version={presence.version} /> : null}
            </div>
            {category ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{category}</p>
            ) : null}
            {presence.longDescription ? (
              <p className="mt-2 text-sm leading-5 text-muted-foreground">{presence.longDescription}</p>
            ) : null}
          </div>
        </div>
      </section>

      <PresenceAboutCard color={presence.color} features={presence.features} urls={presence.urls} />

      <Button
        variant={action === "installed" ? "subtle" : "primary"}
        disabled={action === "installed" || installing}
        onClick={() => onInstall(presence.slug)}
      >
        {installing ? <IconLoader2 className="size-4 animate-spin" /> : null}
        {installing ? t("store-installing") : label}
      </Button>
    </div>
  );
};

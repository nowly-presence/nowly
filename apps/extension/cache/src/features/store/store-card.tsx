import { Button } from "@/components/ui/button";
import { PresenceTile } from "@/components/shared/presence-tile";
import { VersionBadge } from "@/components/shared/version-badge";
import { t } from "@/shared/i18n";
import { IconLoader2 } from "@/lib/tabler-icons";
import type { FC, MouseEvent, ReactElement } from "react";
import type { StorePresence } from "@/features/store/store.model";
import { storeCategoryLabel } from "@/features/store/store.model";

type StoreAction = "install" | "update" | "installed";

type Props = {
  action: StoreAction;
  installing: boolean;
  onInstall: (slug: string) => void;
  onOpen: (slug: string) => void;
  presence: StorePresence;
};

export const StoreCard: FC<Props> = ({
  action,
  installing,
  onInstall,
  onOpen,
  presence,
}): ReactElement => {
  const onAction = (event: MouseEvent): void => {
    event.stopPropagation();
    if (action === "installed" || installing) return;
    onInstall(presence.slug);
  };

  const label =
    action === "installed"
      ? t("store-installed")
      : action === "update"
        ? t("store-update")
        : t("store-install");

  return (
    <article
      className="[content-visibility:auto] [contain-intrinsic-size:0_64px] relative bg-card transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-card-hover"
    >
      <div className="flex items-center gap-3 px-3 py-3">
        <button
          type="button"
          onClick={() => onOpen(presence.slug)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <PresenceTile slug={presence.slug} name={presence.name} className="size-10" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{presence.name}</p>
            <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
              <span className="truncate">{storeCategoryLabel(presence.category)}</span>
              {presence.version ? <VersionBadge version={presence.version} /> : null}
            </p>
          </div>
        </button>
        <Button
          variant={action === "installed" ? "subtle" : "primary"}
          size="sm"
          disabled={action === "installed" || installing}
          onClick={onAction}
        >
          {installing ? <IconLoader2 className="size-3.5 animate-spin" /> : null}
          {installing ? t("store-installing") : label}
        </Button>
      </div>
    </article>
  );
};

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { assetUrl } from "@/shared/api";
import { t } from "@/shared/i18n";
import type { StoredPresence } from "@/shared/types";
import { IconCalendar, IconExternalLink, IconSettings } from "@/lib/tabler-icons";
import type { FC, MouseEvent, ReactElement } from "react";

type Props = {
  onOpen: (slug: string) => void;
  onOpenMarketplace: (slug: string) => void;
  onSchedule: (slug: string) => void;
  onToggle: (slug: string, enabled: boolean) => void;
  presence: StoredPresence;
  showSchedule: boolean;
  slug: string;
  updateAvailable?: string;
};

export const PresenceListItem: FC<Props> = ({
  onOpen,
  onOpenMarketplace,
  onSchedule,
  onToggle,
  presence,
  showSchedule,
  slug,
  updateAvailable,
}): ReactElement | null => {
  if (!presence?.metadata) return null;

  const openUpdate = (event: MouseEvent): void => {
    event.stopPropagation();
    onOpenMarketplace(slug);
  };

  return (
    <article className="relative bg-card transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-card-hover">
      {updateAvailable ? (
        <div className="flex h-8 items-center gap-2 border-b border-border bg-card px-1.5">
          <span className="inline-flex h-5 shrink-0 items-center rounded-md border border-accent/20 bg-accent/10 px-1.5 text-[10px] font-semibold tabular-nums text-accent">
            {t("version", { version: updateAvailable })}
          </span>

          <button
            type="button"
            onClick={openUpdate}
            className="min-w-0 flex-1 truncate text-left text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("presence-update-available")}
          </button>

          <Button
            variant="unstyled"
            size="none"
            onClick={openUpdate}
            className="inline-flex h-6 shrink-0 items-center gap-1 rounded-md border border-border bg-card-2 px-2 text-[11px] font-semibold text-foreground transition-colors hover:bg-card-hover"
          >
            {t("presence-update-action")}
            <IconExternalLink className="h-3 w-3" />
          </Button>
        </div>
      ) : null}
      <div className="flex items-center gap-3 px-3 py-3">
        <button
          type="button"
          onClick={() => onOpen(slug)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div
            className={`flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl transition-all duration-300 ${
              !presence.enabled ? "opacity-60 saturate-0" : ""
            }`}
            style={{ backgroundColor: `${presence.metadata.color}20` }}
          >
            <img src={assetUrl(slug, "icon")} alt="" className={`h-6 w-6 object-contain transition-all duration-300 ${
              !presence.enabled ? "opacity-60 saturate-0" : ""
            }`} />
          </div>

          <div className="min-w-0 flex-1">
            <p className={`truncate text-sm font-medium transition-all duration-300 ${
              presence.enabled ? "text-foreground" : "text-muted-foreground/80"
            }`}>{presence.metadata.name}</p>
            <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: presence.enabled ? presence.metadata.color : "var(--color-dim-foreground)" }}
              />

              <span className="truncate">{presence.enabled ? t("enabled") : t("disabled")}</span>
              {presence.metadata.version ? (
                <span className="truncate">{t("version", { version: presence.metadata.version })}</span>
              ) : null}
            </div>
          </div>
        </button>

        <Switch
          checked={presence.enabled}
          onChange={(checked) => onToggle(slug, checked)}
          ariaLabel={presence.enabled ? t("disable") : t("enable")}
        />

        {showSchedule ? (
          <Button
            variant="unstyled"
            size="none"
            onClick={() => onSchedule(slug)}
            className="flex size-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-card-2 hover:text-foreground"
            aria-label={t("schedule")}
          >
            <IconCalendar className="h-4 w-4" />
          </Button>
        ) : null}

        <Button
          variant="unstyled"
          size="none"
          onClick={() => onOpen(slug)}
          className="flex size-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-card-2 hover:text-foreground"
          aria-label={t("settings")}
          title={t("settings")}
        >
          <IconSettings className="h-4 w-4" />
        </Button>
      </div>
    </article>
  );
};

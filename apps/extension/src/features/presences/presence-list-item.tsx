import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { assetUrl } from "@/shared/api";
import { t } from "@/shared/i18n";
import type { StoredPresence } from "@/shared/types";
import { IconCalendar, IconExternalLink } from "@tabler/icons-react";
import type { FC, MouseEvent, ReactElement } from "react";
import { PresenceSettingsPanel } from "@/features/presences/presence-settings-panel";

type Props = {
  onOpenMarketplace: (slug: string) => void;
  onRemove: (slug: string) => void;
  onSchedule: (slug: string) => void;
  onToggle: (slug: string, enabled: boolean) => void;
  presence: StoredPresence;
  showSchedule: boolean;
  slug: string;
  updateAvailable?: string;
};

export const PresenceListItem: FC<Props> = ({ onOpenMarketplace, onRemove, onSchedule, onToggle, presence, showSchedule, slug, updateAvailable }): ReactElement | null => {
  if (!presence?.metadata) return null;

  const visibleUpdate = updateAvailable;

  const openUpdate = (event: MouseEvent): void => {
    event.stopPropagation();
    onOpenMarketplace(slug);
  };

  return (
    <article className="group relative overflow-hidden bg-card-2 transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-card-hover">
      {visibleUpdate ? (
        <div className="flex h-8 items-center gap-2 border-b border-border bg-card px-1.5">
          <span className="inline-flex h-5 shrink-0 items-center rounded-md border border-accent/20 bg-accent/10 px-1.5 text-[10px] font-semibold tabular-nums text-accent">
            {t("version", { version: visibleUpdate })}
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
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg transition-all duration-300 ${
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

            <span className="truncate">
              {presence.enabled ? t("enabled") : t("disabled")}
              {presence.metadata.version ? ` - ${t("version", { version: presence.metadata.version })}` : ""}
            </span>
          </div>
        </div>

        <Switch
          checked={presence.enabled}
          onChange={(checked) => onToggle(slug, checked)}
          ariaLabel={presence.enabled ? t("disable") : t("enable")}
        />

        <div className="flex items-center gap-0.5">
          {showSchedule ? (
            <Button
              variant="unstyled"
              size="none"
              onClick={(event: MouseEvent) => {
                event.stopPropagation();
                onSchedule(slug);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-card-2 hover:text-foreground"
              aria-label="Schedule"
            >
              <IconCalendar className="h-4 w-4" />
            </Button>
          ) : null}

          <PresenceSettingsPanel
            definitions={(presence.metadata.settings ?? {}) as Record<string, unknown>}
            onRemove={() => onRemove(slug)}
            slug={slug}
          />
        </div>
      </div>
    </article>
  );
};

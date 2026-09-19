import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PresenceTile } from "@/components/shared/presence-tile";
import { VersionBadge } from "@/components/shared/version-badge";
import { t } from "@/shared/i18n";
import type { StoredPresence } from "@/shared/types";
import { IconCalendar, IconLoader2, IconSettings } from "@/lib/tabler-icons";
import type { FC, MouseEvent, ReactElement } from "react";

type Props = {
  onOpen: (slug: string) => void;
  onUpdatePresence: (slug: string) => void;
  updating?: boolean;
  onSchedule: (slug: string) => void;
  onToggle: (slug: string, enabled: boolean) => void;
  presence: StoredPresence;
  showSchedule: boolean;
  slug: string;
  updateAvailable?: string;
};

export const PresenceListItem: FC<Props> = ({
  onOpen,
  onUpdatePresence,
  updating = false,
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
    if (updating) return;
    onUpdatePresence(slug);
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
            className="inline-flex h-6 shrink-0 items-center gap-1 rounded-md border border-border bg-card-2 px-2 text-[11px] font-semibold text-foreground transition-colors hover:bg-card-hover disabled:opacity-60"
            disabled={updating}
          >
            {updating ? <IconLoader2 className="h-3 w-3 animate-spin" /> : null}
            {updating ? t("store-installing") : t("presence-update-action")}
          </Button>
        </div>
      ) : null}
      <div className="flex items-center gap-3 px-3 py-3">
        <button
          type="button"
          onClick={() => onOpen(slug)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <PresenceTile slug={slug} name={presence.metadata.name} dimmed={!presence.enabled} className="size-10" />

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
                <VersionBadge version={presence.metadata.version} />
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

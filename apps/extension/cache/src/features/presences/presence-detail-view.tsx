import { Dialog, dialogDangerClassName, dialogDangerSolidClassName, dialogSecondaryClassName } from "@/components/shared/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PresenceCreditsCard } from "@/features/presences/presence-credits-card";
import { PresenceAboutCard } from "@/features/presences/presence-detail-info";
import { DiscordNativeNotice } from "@/features/presences/discord-native-notice";
import { PresenceHeroCard } from "@/features/presences/presence-hero-card";
import { resolveLocaleList, resolveLocaleString } from "@/features/presences/presence-locale";
import { PresenceSettingsFields } from "@/features/presences/presence-settings-fields";
import { getCategoryLabel } from "@/features/presences/presence-list.model";
import { PresenceTile } from "@/components/shared/presence-tile";
import { VersionBadge } from "@/components/shared/version-badge";
import { t } from "@/shared/i18n";
import type { StoredPresence } from "@/shared/types";
import { IconCalendar, IconChevronLeft, IconExternalLink, IconLoader2, IconTrash } from "@/lib/tabler-icons";
import type { FC, MouseEvent, ReactElement } from "react";
import { useEffect, useState } from "react";

type Props = {
  onBack: () => void;
  onOpenWebsite: (slug: string) => void;
  onRemove: (slug: string) => void;
  onSchedule?: (slug: string) => void;
  onToggle: (slug: string, enabled: boolean) => void;
  onUpdatePresence: (slug: string) => void;
  presence: StoredPresence;
  slug: string;
  updateAvailable?: string;
  updating?: boolean;
};

const actionRowClassName =
  "flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-card-hover";

export const PresenceDetailView: FC<Props> = ({
  onBack,
  onOpenWebsite,
  onRemove,
  onSchedule,
  onToggle,
  onUpdatePresence,
  presence,
  slug,
  updateAvailable,
  updating = false,
}): ReactElement => {
  const color = presence.metadata.color;
  const description = resolveLocaleString(presence.metadata.description);
  const features = resolveLocaleList(presence.metadata.features);
  const urls = [...new Set(presence.metadata.url ?? [])];
  const [confirmUninstall, setConfirmUninstall] = useState(false);
  const category = getCategoryLabel(presence.metadata.category);

  useEffect(() => {
    document.getElementById("sidepanel-tabpanel")?.scrollTo(0, 0);
  }, [slug]);

  const openUpdate = (event: MouseEvent): void => {
    event.stopPropagation();
    if (updating) return;
    onUpdatePresence(slug);
  };

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

      <PresenceHeroCard
        key={slug}
        slug={slug}
        color={color}
        footer={
          updateAvailable ? (
            <button
              type="button"
              onClick={openUpdate}
              className="relative z-10 flex w-full items-center gap-2 border-t border-accent/20 bg-accent/10 px-4 py-2 text-left text-xs font-medium text-accent disabled:opacity-60"
              disabled={updating}
            >
              <span className="min-w-0 flex-1">{t("presence-update-available")}</span>
              <span className="inline-flex shrink-0 items-center gap-1">
                {updating ? <IconLoader2 className="size-3.5 animate-spin" /> : null}
                {updating ? t("store-installing") : t("presence-update-action")}
              </span>
            </button>
          ) : null
        }
      >
        <div className="flex items-start gap-3">
          <PresenceTile slug={slug} name={presence.metadata.name} dimmed={!presence.enabled} className="size-12" />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="min-w-0 truncate text-base font-semibold text-foreground">{presence.metadata.name}</h1>
              {presence.metadata.version ? <VersionBadge version={presence.metadata.version} /> : null}
            </div>
            {category ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{category}</p>
            ) : null}
            {description ? (
              <p className="mt-2 text-sm leading-5 text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <Switch
            checked={presence.enabled}
            onChange={(checked) => onToggle(slug, checked)}
            ariaLabel={presence.enabled ? t("disable") : t("enable")}
          />
        </div>
      </PresenceHeroCard>

      {presence.metadata.discordNative ? (
        <DiscordNativeNotice name={presence.metadata.name} />
      ) : null}

      <PresenceAboutCard features={features} urls={urls} />
      <PresenceCreditsCard
        author={presence.metadata.author}
        contributors={presence.metadata.contributors}
      />

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <h2 className="px-4 pt-3 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("settings")}</h2>
        <div className="divide-y divide-border border-t border-border">
          <PresenceSettingsFields
            definitions={(presence.metadata.settings ?? {}) as Record<string, unknown>}
            locales={presence.metadata.locales}
            slug={slug}
          />
          {onSchedule ? (
            <button type="button" onClick={() => onSchedule(slug)} className={actionRowClassName}>
              <IconCalendar className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">{t("schedule")}</span>
            </button>
          ) : null}
          <button type="button" onClick={() => onOpenWebsite(slug)} className={actionRowClassName}>
            <IconExternalLink className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">{t("presence-open-site")}</span>
          </button>
        </div>
      </section>

      <Button
        variant="unstyled"
        size="none"
        onClick={() => setConfirmUninstall(true)}
        className={dialogDangerClassName}
      >
        <IconTrash className="size-4" />
        {t("uninstall")}
      </Button>

      <Dialog
        open={confirmUninstall}
        onClose={() => setConfirmUninstall(false)}
        title={t("uninstall")}
        subtitle={t("uninstall-confirm", { name: presence.metadata.name })}
        footer={(
          <>
            <Button
              variant="unstyled"
              size="none"
              onClick={() => {
                onRemove(slug);
                setConfirmUninstall(false);
              }}
              className={dialogDangerSolidClassName}
            >
              <IconTrash className="size-4" />
              {t("uninstall")}
            </Button>
            <Button
              variant="unstyled"
              size="none"
              onClick={() => setConfirmUninstall(false)}
              className={dialogSecondaryClassName}
            >
              {t("cancel")}
            </Button>
          </>
        )}
      />
    </div>
  );
};

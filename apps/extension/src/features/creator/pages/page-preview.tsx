import { RiErrorWarningLine, RiPlayLine, RiStopLine } from "@remixicon/react";
import { LiveCard } from "@/components/shared/live-activity-card";
import { useI18n } from "@/hooks/i18n-provider";
import { writtenLocales } from "@nowly/presence-creator/creator-files";
import type { CreatorDraft, CreatorPage } from "@nowly/presence-creator/creator-types";
import type { PresencePayload } from "@/shared/types";
import { Button } from "@/ui/button";
import { Frame } from "@/ui/frame";
import { Switch } from "@/ui/switch";
import { useEditLocale } from "@/features/creator/creator-locale-tabs";
import { usePageTest } from "@/features/creator/pages/use-page-test";

const PREVIEW_SLUG = "creator-draft";

const Warning = ({ children }: { children: string }) => (
  <span className="flex items-start gap-1.5 text-label-md text-danger">
    <RiErrorWarningLine className="mt-0.5 size-4 shrink-0" />
    {children}
  </span>
);

export const PagePreview = ({ draft, page }: {
  draft: CreatorDraft;
  page: CreatorPage;
}) => {
  const { t } = useI18n();
  const [locale] = useEditLocale(`page:${page.id}`, writtenLocales(draft), draft.baseLocale);
  const { running, toggle, state, discord, setDiscord, discordError } = usePageTest(draft, page, locale);
  const ready = state.status === "ready" ? state : null;
  const payload: PresencePayload | null = ready
    ? {
        name: ready.preview.activity.name,
        details: ready.preview.activity.details,
        state: ready.preview.activity.state,
        startTime: ready.preview.activity.startTimestamp,
        endTime: ready.preview.activity.endTimestamp,
        largeImage: ready.preview.largeImage,
        type: ready.preview.activity.type,
        buttons: ready.preview.activity.buttons
      }
    : null;

  return (
    <Frame
      title={t("creator.preview.title")}
      description={t("creator.preview.hint")}
      action={
        <Button
          size="sm"
          variant={running ? "secondary" : "primary"}
          icon={running ? <RiStopLine className="size-4" /> : <RiPlayLine className="size-4" />}
          onClick={toggle}
        >
          {running ? t("creator.preview.stop") : t("creator.preview.start")}
        </Button>
      }
    >
      {!running && <p className="text-label-md text-muted">{t("creator.preview.idle")}</p>}
      {running && state.status === "error" && <Warning>{state.error === "NO_TAB" ? t("creator.variables.noTab") : t("creator.variables.unreachable")}</Warning>}
      {ready && !ready.matches && <Warning>{t("creator.preview.noMatch")}</Warning>}
      {ready && ready.preview.missing.map((name) => <Warning key={name}>{t("creator.preview.missing", { name: `{${name}}` })}</Warning>)}
      {running && payload && (
        <LiveCard
          slug={PREVIEW_SLUG}
          presence={payload}
          presenceName={draft.name.trim() || t("creator.untitled")}
          t={t}
          compact
          fallbackImage={draft.assets.logo}
        />
      )}

      {running && (
        <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
          <div className="flex flex-col">
            <span className="text-label-lg font-medium">{t("creator.preview.discord")}</span>
            <span className="text-label-md text-muted">{t("creator.preview.discordHint")}</span>
          </div>
          <Switch checked={discord} label={t("creator.preview.discord")} onChange={setDiscord} />
        </div>
      )}
      {discord && discordError && <Warning>{discordError === "PAUSED" ? t("creator.preview.paused") : t("creator.preview.noHost")}</Warning>}
    </Frame>
  );
};
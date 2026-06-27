"use client";

import { Card } from "@/components/ui/card";
import { PROJECT_EXTENSION_DOWNLOAD_URL } from "@/lib/constants";
import type { Presence } from "@/lib/data/presences";
import { IconExternalLink } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";
import type { ExtensionDiagnostic } from "./extension-diagnostic";

type Props = {
  diagnostic: ExtensionDiagnostic | null;
  extDetected: boolean;
  isInstalled: boolean;
  onInstall: () => void;
  presence: Presence;
};

const primarySupportedUrl = (presence: Presence): string => {
  if (presence.slug === "youtube") return "https://youtube.com";
  const first = presence.supportedUrls[0] ?? "https://youtube.com";
  const host = first.replace(/^https?:\/\//, "").replace(/^\*\./, "").replace(/\/.*$/, "");
  return `https://${host}`;
};

export const PresenceSetupCard: FC<Props> = ({
  diagnostic,
  extDetected,
  isInstalled,
  onInstall,
  presence,
}): ReactElement => {
  const t = useTranslations("marketplace-detail");
  const isYoutube = presence.slug === "youtube";

  if (!extDetected) {
    return (
      <Card size="sm" className="border-warning/20 bg-warning/5">
        <h2 className="text-sm font-semibold text-foreground">{t("extension-missing-title")}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("extension-missing-description")}</p>
        <a
          href={PROJECT_EXTENSION_DOWNLOAD_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border bg-card-2 px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-card-hover"
        >
          {t("extension-install-action")}
          <IconExternalLink className="size-4" />
        </a>
      </Card>
    );
  }

  const supportedUrl = primarySupportedUrl(presence);

  if (isInstalled) {
    return (
      <Card size="sm" className="border-success/20 bg-success/5">
        <h2 className="text-sm font-semibold text-foreground">{t("presence-installed-title")}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {isYoutube
            ? t("presence-installed-youtube-description")
            : t("presence-installed-description", { platform: presence.name })}
        </p>
        {diagnostic && !diagnostic.hostDetected ? (
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{t("diagnostic-host-missing-message")}</p>
        ) : diagnostic && !diagnostic.discordConnected ? (
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{t("diagnostic-discord-closed-message")}</p>
        ) : null}
        <a
          href={supportedUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-success/20 bg-success/10 px-3 py-2 text-sm font-semibold text-success transition-colors hover:bg-success/20"
        >
          {isYoutube ? t("test-youtube-action") : t("open-supported-site-action")}
          <IconExternalLink className="size-4" />
        </a>
      </Card>
    );
  }

  return (
    <Card size="sm">
      <h2 className="text-sm font-semibold text-foreground">{t("presence-not-installed-title")}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {isYoutube ? t("youtube-test-description") : t("presence-not-installed-description", { platform: presence.name })}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onInstall}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          {isYoutube ? t("install-youtube-action") : t("install-action")}
        </button>
        {supportedUrl !== "https://youtube.com" ? (
          <a
            href={supportedUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card-2 px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
          >
            {t("open-supported-site-action")}
            <IconExternalLink className="size-4" />
          </a>
        ) : null}
      </div>
    </Card>
  );
};

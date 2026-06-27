"use client";

import { IconCheck, IconLoader2 } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";

type Props = {
  consentStatus: "loading" | "granted" | "denied" | "error";
  deviceId: string;
};

export const ConsentStatusCard: FC<Props> = ({ consentStatus, deviceId }) => {
  const t = useTranslations("consent-page");

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {t("consent-status")}
      </h2>

      {consentStatus === "loading" ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <IconLoader2 className="h-4 w-4 animate-spin" />
          {t("loading")}
        </div>
      ) : consentStatus === "granted" ? (
        <div className="flex items-center gap-2 text-sm text-foreground">
          <IconCheck className="h-4 w-4 text-emerald-500" />
          {t("consent-granted")}
        </div>
      ) : consentStatus === "denied" ? (
        <p className="text-sm text-muted-foreground">{t("consent-denied")}</p>
      ) : (
        <p className="text-sm text-warning">{t("consent-denied")}</p>
      )}

      <p className="mt-2 text-xs text-dim-foreground">
        {t("device-id")}: <code className="rounded bg-card-2 px-1 py-0.5 text-[11px]">{deviceId}</code>
      </p>
    </section>
  );
};

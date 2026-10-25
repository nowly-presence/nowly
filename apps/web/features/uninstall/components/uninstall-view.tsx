"use client";

import { ExtensionStoreButton } from "@/components/extension-store-button";
import { siteConsent, trackProduct } from "@/lib/telemetry";
import { Button, ButtonAnchor, Card, CardContent, CardDescription, CardTitle, Separator } from "@nowly/ui";
import { DISCORD_INVITE_URL } from "@/lib/constants";
import { presenceApiBaseUrl } from "@/lib/presence-api-client";
import { RiDiscordFill, RiHeartLine } from "@nowly/ui/icons";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export const UninstallView = () => {
  const t = useTranslations("uninstallPage");
  const searchParams = useSearchParams();
  const deviceId = searchParams.get("deviceId");
  const token = searchParams.get("token");
  const [busy, setBusy] = useState(false);
  const [choice, setChoice] = useState<"kept" | "deleted" | "error" | null>(null);
  const landingTrackedRef = useRef(false);

  useEffect(() => {
    const recordLanding = () => {
      if (!deviceId || landingTrackedRef.current || siteConsent() !== true) return;

      landingTrackedRef.current = true;
      trackProduct({
        name: "uninstall_page_opened",
        source: "web",
        data: {}
      });
    };
    recordLanding();
    window.addEventListener("nowly:product-consent", recordLanding);
    return () => window.removeEventListener("nowly:product-consent", recordLanding);
  }, [deviceId]);

  const onKeep = (): void => {
    setChoice("kept");
  };

  const onDelete = async (): Promise<void> => {
    if (!deviceId) return;

    setBusy(true);

    try {
      const response = await fetch(`${presenceApiBaseUrl()}/devices/${encodeURIComponent(deviceId)}`, {
        method: "DELETE",
        headers: token ? { "X-Device-Token": token } : {}
      });

      if (!response.ok) throw new Error("delete failed");

      setChoice("deleted");
    } catch {
      setChoice("error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pb-24 pt-16 sm:pb-32 sm:pt-24">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-10">
        <header className="max-w-xl">
          <p className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent">{t("eyebrow")}</p>
          <h1 className="text-pretty text-[2.2rem] font-medium leading-[1.08] tracking-tight text-foreground sm:text-[2.75rem]">{t("title")}</h1>
          <p className="mt-4 text-[1.05rem] leading-relaxed text-foreground/68">{t("description")}</p>
        </header>

        <Card className="mt-14 max-w-xl">
          <CardContent>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-foreground/6">
              <RiHeartLine className="size-6" />
            </div>
            <CardTitle className="mt-4 text-lg">{t("feedback-title")}</CardTitle>
            <CardDescription className="mt-2">{t("feedback-description")}</CardDescription>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonAnchor href={DISCORD_INVITE_URL} rel="noreferrer" target="_blank" variant="outline">
                <RiDiscordFill data-icon="inline-start" />
                {t("discord")}
              </ButtonAnchor>
              <ExtensionStoreButton variant="ghost" />
            </div>

            {deviceId ? (
              <>
                <Separator className="my-6" />
                <p className="text-xs text-muted-foreground">{t("data-description")}</p>
                {choice ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {choice === "kept" ? t("keep-success") : choice === "deleted" ? t("delete-success") : t("action-error")}
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-4">
                    <Button variant="link" size="sm" disabled={busy} onClick={onKeep} className="h-auto p-0 text-xs text-muted-foreground">
                      {t("keep")}
                    </Button>
                    <Button
                      variant="link"
                      size="sm"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm(t("delete-confirm"))) void onDelete();
                      }}
                      className="h-auto p-0 text-xs text-muted-foreground"
                    >
                      {t("delete")}
                    </Button>
                  </div>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
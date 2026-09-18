"use client";

import { ExtensionStoreButton } from "@/components/extension-store-button";
import { ButtonAnchor, Card, CardContent, CardDescription, CardTitle } from "@nowly/ui";


import { DISCORD_INVITE_URL } from "@/lib/constants";
import { RiDiscordFill, RiHeartLine } from "@nowly/ui/icons";
import { useTranslations } from "next-intl";

export const UninstallView = () => {
  const t = useTranslations("uninstallPage");

  return (
    <div className="pb-24 pt-16 sm:pb-32 sm:pt-24">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-10">
        <header className="max-w-xl">
          <p className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent">
            {t("eyebrow")}
          </p>
          <h1 className="text-pretty text-[2.2rem] font-medium leading-[1.08] tracking-tight text-foreground sm:text-[2.75rem]">
            {t("title")}
          </h1>
          <p className="mt-4 text-[1.05rem] leading-relaxed text-foreground/68">
            {t("description")}
          </p>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

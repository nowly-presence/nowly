"use client";

import { AccountPageFrame } from "@/features/account/components/account-page-frame";
import { startDiscordSignIn } from "@/features/account/lib/account-api";
import { siteBaseUrl } from "@/lib/api-base";
import { Button, Card, CardContent, CardDescription, CardTitle } from "@nowly/ui";
import { RiDiscordFill } from "@nowly/ui/icons";
import { useTranslations } from "next-intl";
import { useState } from "react";

export const SignInView = () => {
  const t = useTranslations("accountPage");
  const shell = useTranslations("shell");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const onSignIn = (): void => {
    setBusy(true);
    setFailed(false);
    startDiscordSignIn(`${window.location.origin}/profile`).catch(() => {
      setBusy(false);
      setFailed(true);
    });
  };

  return (
    <AccountPageFrame eyebrow={t("eyebrow")} title={t("title")} description={t("description")}>
      <Card className="max-w-xl">
        <CardContent>
          <CardTitle className="text-lg">{t("sign-in-title")}</CardTitle>
          <CardDescription className="mt-2">{t("sign-in-description")}</CardDescription>
          <Button className="mt-6" disabled={busy} onClick={onSignIn}>
            <RiDiscordFill data-icon="inline-start" />
            {t("sign-in")}
          </Button>
          {failed ? <p className="mt-3 text-sm text-destructive">{t("action-error")}</p> : null}
          <a href={siteBaseUrl()} className="mt-6 block text-sm text-foreground/60 underline-offset-4 hover:underline">
            {shell("back-to-site")}
          </a>
        </CardContent>
      </Card>
    </AccountPageFrame>
  );
};
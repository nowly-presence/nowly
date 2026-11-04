"use client";

import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthFrame } from "@/features/auth/components/auth-frame";
import { startDiscordSignIn } from "@/features/account/lib/account-api";
import { Button } from "@nowly/ui";
import { RiDiscordFill } from "@nowly/ui/icons";
import { useTranslations } from "next-intl";
import { useState } from "react";

export const SignInView = () => {
  const t = useTranslations("accountPage");
  const auth = useTranslations("extensionConnectPage");
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
    <AuthFrame>
      <AuthCard
        title={t("sign-in-title")}
        description={t("sign-in-description")}
        permissions={[
          auth("perm-name"),
          auth("perm-private")
        ]}
      >
        <Button size="lg" className="w-full" disabled={busy} onClick={onSignIn}>
          <RiDiscordFill data-icon="inline-start" />
          {t("sign-in")}
        </Button>
        {failed ? <p className="text-center text-sm text-destructive">{t("action-error")}</p> : null}
      </AuthCard>
    </AuthFrame>
  );
};
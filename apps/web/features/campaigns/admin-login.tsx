"use client";

import { signOutAccount, startDiscordSignIn } from "@/features/account/lib/account-api";
import { Button } from "@nowly/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";

export const CampaignAdminLogin = () => {
  const t = useTranslations("accountPage");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const signIn = async () => {
    setBusy(true);
    setFailed(false);

    try {
      await signOutAccount();
      await startDiscordSignIn(window.location.href);
    } catch {
      setFailed(true);
      setBusy(false);
    }
  };
  return (
    <div>
      <Button disabled={busy} onClick={signIn}>
        {t("sign-in")}
      </Button>
      {failed ? (
        <p role="alert" className="mt-3 text-destructive">
          {t("action-error")}
        </p>
      ) : null}
    </div>
  );
};
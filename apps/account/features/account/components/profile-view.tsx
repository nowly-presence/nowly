"use client";

import { AccountPageFrame } from "@/features/account/components/account-page-frame";
import { AccountProfileTab } from "@/features/account/components/account-profile-tab";
import { useSessionUser } from "@/features/account/components/session-provider";
import { deleteAccount, downloadAccountExport, signOutAccount } from "@/features/account/lib/account-api";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

type Message = "exported" | "error" | null;

export const ProfileView = () => {
  const t = useTranslations("accountPage");
  const user = useSessionUser();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const [deleted, setDeleted] = useState(false);

  const run = async (action: () => Promise<void>): Promise<void> => {
    setBusy(true);
    setMessage(null);

    try {
      await action();
    } catch {
      setMessage("error");
    } finally {
      setBusy(false);
    }
  };

  const onExport = () =>
    run(async () => {
      await downloadAccountExport();
      setMessage("exported");
    });

  const onSignOut = () =>
    run(async () => {
      await signOutAccount();
      router.replace("/sign-in");
    });

  const onDelete = () => {
    if (!window.confirm(t("delete-confirm"))) return;

    void run(async () => {
      await deleteAccount();
      await signOutAccount().catch(() => undefined);
      setDeleted(true);
    });
  };

  return (
    <AccountPageFrame eyebrow={t("eyebrow")} title={t("tab-profile")} description={t("description")}>
      {deleted ? (
        <p className="text-sm text-muted-foreground">{t("delete-success")}</p>
      ) : (
        <AccountProfileTab user={user} busy={busy} message={message} onSignOut={onSignOut} onExport={onExport} onDelete={onDelete} />
      )}
    </AccountPageFrame>
  );
};
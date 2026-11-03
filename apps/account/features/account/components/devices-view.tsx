"use client";

import { AccountDevicesTab } from "@/features/account/components/account-devices-tab";
import { AccountPageFrame } from "@/features/account/components/account-page-frame";
import { fetchAccountDevices, unlinkAccountDevice, type AccountDevice } from "@/features/account/lib/account-api";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export const DevicesView = () => {
  const t = useTranslations("accountPage");
  const [devices, setDevices] = useState<AccountDevice[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchAccountDevices()
      .then(setDevices)
      .catch(() => setFailed(true));
  }, []);

  const onUnlink = (deviceId: string) => {
    if (!window.confirm(t("unlink-confirm"))) return;

    setBusy(true);
    setFailed(false);
    unlinkAccountDevice(deviceId)
      .then(() => setDevices((current) => (current ?? []).filter((device) => device.deviceId !== deviceId)))
      .catch(() => setFailed(true))
      .finally(() => setBusy(false));
  };

  return (
    <AccountPageFrame eyebrow={t("eyebrow")} title={t("tab-devices")} description={t("devices-description")}>
      {devices ? (
        <AccountDevicesTab devices={devices} busy={busy} error={failed} onUnlink={onUnlink} />
      ) : (
        <p className="text-sm text-muted-foreground">{failed ? t("action-error") : t("checking")}</p>
      )}
    </AccountPageFrame>
  );
};
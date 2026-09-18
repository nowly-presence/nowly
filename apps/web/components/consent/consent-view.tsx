"use client";

import { Button, Card, CardContent, CardDescription, CardTitle, Switch } from "@nowly/ui";



import {
  requestExtension,
  subscribeExtensionDetected,
  type ExtensionDeviceInfo,
} from "@/lib/extension-bridge";
import { presenceApiBaseUrl } from "@/lib/presence-api";
import { RiDownload2Line, RiDeleteBinLine, RiShieldCheckLine } from "@nowly/ui/icons";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type Status = "checking" | "not-detected" | "ready";

export const ConsentView = () => {
  const t = useTranslations("consentPage");
  const [status, setStatus] = useState<Status>("checking");
  const [device, setDevice] = useState<ExtensionDeviceInfo | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<"exported" | "deleted" | "error" | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeExtensionDetected((detected) => {
      if (!detected) {
        setStatus("not-detected");
        return;
      }
      Promise.all([
        requestExtension<ExtensionDeviceInfo>("GET_DEVICE_INFO"),
        requestExtension<{ granted?: boolean }>("GET_ANALYTICS_CONSENT"),
      ]).then(([deviceInfo, consentInfo]) => {
        setDevice(deviceInfo);
        setConsent(consentInfo?.granted === true);
        setStatus("ready");
      }).catch(() => setStatus("not-detected"));
    });
    return unsubscribe;
  }, []);

  const onToggleConsent = async (granted: boolean): Promise<void> => {
    setConsent(granted);
    const result = await requestExtension<{ granted?: boolean }>("SET_ANALYTICS_CONSENT", { granted });
    setConsent(result?.granted === true);
  };

  const authHeaders = (): Record<string, string> =>
    device?.deviceToken ? { "X-Device-Token": device.deviceToken } : {};

  const onExport = async (): Promise<void> => {
    if (!device?.deviceId) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`${presenceApiBaseUrl()}/devices/${encodeURIComponent(device.deviceId)}/export`, {
        headers: authHeaders(),
        cache: "no-store",
      });
      if (!response.ok) throw new Error("export failed");
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "nowly-my-data.json";
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage("exported");
    } catch {
      setMessage("error");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (): Promise<void> => {
    if (!device?.deviceId) return;
    if (!window.confirm(t("delete-confirm"))) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`${presenceApiBaseUrl()}/devices/${encodeURIComponent(device.deviceId)}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error("delete failed");
      setMessage("deleted");
    } catch {
      setMessage("error");
    } finally {
      setBusy(false);
    }
  };

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

        {status === "checking" ? (
          <p className="mt-14 text-sm text-muted-foreground">{t("checking")}</p>
        ) : status === "not-detected" ? (
          <Card className="mt-14 max-w-xl">
            <CardContent>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-foreground/6">
                <RiShieldCheckLine className="size-6" />
              </div>
              <CardTitle className="mt-4 text-lg">{t("not-detected-title")}</CardTitle>
              <CardDescription className="mt-2">{t("not-detected-description")}</CardDescription>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-14 flex max-w-xl flex-col gap-6">
            <Card>
              <CardContent>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{t("toggle-title")}</CardTitle>
                    <CardDescription className="mt-2">{t("toggle-description")}</CardDescription>
                  </div>
                  <Switch checked={consent} onCheckedChange={onToggleConsent} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <CardTitle className="text-lg">{t("data-title")}</CardTitle>
                <CardDescription className="mt-2">{t("data-description")}</CardDescription>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button variant="outline" disabled={busy} onClick={onExport}>
                    <RiDownload2Line data-icon="inline-start" />
                    {t("export")}
                  </Button>
                  <Button variant="outline" disabled={busy} onClick={onDelete}>
                    <RiDeleteBinLine data-icon="inline-start" />
                    {t("delete")}
                  </Button>
                </div>
                {message === "exported" ? <p className="mt-3 text-sm text-muted-foreground">{t("export-success")}</p> : null}
                {message === "deleted" ? <p className="mt-3 text-sm text-muted-foreground">{t("delete-success")}</p> : null}
                {message === "error" ? <p className="mt-3 text-sm text-destructive">{t("action-error")}</p> : null}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

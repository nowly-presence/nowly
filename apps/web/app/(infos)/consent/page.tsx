"use client";

import { PageLayout } from "@/components/layout/page-layout";
import { API_BASE_URL } from "@/lib/constants";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { ConsentStatusCard } from "./_components/consent-status-card";
import { DeleteCard } from "./_components/delete-card";
import { ExportCard } from "./_components/export-card";

const EXT_SOURCE = "Nowly";
const EXT_TIMEOUT_MS = 3000;

type ConsentStatus = "loading" | "granted" | "denied" | "error";

let messageId = 0;
const nextId = (): string => {
  messageId += 1;
  return `consent_${messageId}_${Date.now()}`;
};

const ConsentPage = () => {
  const t = useTranslations("consent-page");
  const [extDetected, setExtDetected] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>("loading");

  const requestDeviceInfo = useCallback(() => {
    window.postMessage({ source: EXT_SOURCE, type: "GET_DEVICE_INFO", messageId: nextId() }, "*");
  }, []);

  useEffect(() => {
    const ping = window.setInterval(() => {
      window.postMessage({ source: EXT_SOURCE, type: "PING" }, "*");
    }, 300);

    const timeout = window.setTimeout(() => {
      window.clearInterval(ping);
      setTimedOut(true);
    }, EXT_TIMEOUT_MS);

    const handler = (event: MessageEvent): void => {
      const msg = event.data ?? {};

      if (msg.type === "EXT_DETECTED") {
        setExtDetected(true);
        window.clearInterval(ping);
        requestDeviceInfo();
      }

      if (msg.source === EXT_SOURCE && msg.type === "DEVICE_INFO") {
        const payload = msg.payload as { deviceId?: string; deviceToken?: string | null } | undefined;
        if (payload?.deviceId) {
          setDeviceId(payload.deviceId);
          setDeviceToken(payload.deviceToken ?? null);
        }
        window.clearInterval(ping);
        window.clearTimeout(timeout);
      }
    };

    window.addEventListener("message", handler);

    return () => {
      window.removeEventListener("message", handler);
      window.clearInterval(ping);
      window.clearTimeout(timeout);
    };
  }, [requestDeviceInfo]);

  useEffect(() => {
    if (!deviceId) return;

    fetch(`${API_BASE_URL}/analytics/device/${encodeURIComponent(deviceId)}/export`, {
      cache: "no-store",
      headers: deviceToken ? { "X-Device-Token": deviceToken } : undefined,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Device not found");
        return res.json();
      })
      .then((data) => {
        setConsentStatus(data.device?.analyticsConsent ? "granted" : "denied");
      })
      .catch(() => setConsentStatus("error"));
  }, [deviceId, deviceToken]);

  const showNoExtension = !extDetected && timedOut;

  return (
    <PageLayout>
      <main className="mx-auto w-full max-w-3xl min-w-0 px-6 py-24">
        <div className="mb-12 min-w-0 py-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded border border-accent/20 bg-accent/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-accent">
            {t("badge")}
          </div>

          <h1 className="mx-auto mb-4 max-w-3xl text-balance text-[2rem] font-extrabold tracking-tight md:text-[2.25rem]">
            {t("title")}
          </h1>

          <p className="mx-auto max-w-2xl text-balance text-muted-foreground">
            {t("intro")}
          </p>
        </div>

        {showNoExtension ? (
          <section className="rounded-lg border border-border bg-card p-6 text-center">
            <IconAlertTriangle className="mx-auto mb-3 h-8 w-8 text-warning" />
            <p className="text-sm text-muted-foreground">{t("no-device")}</p>
          </section>
        ) : deviceId ? (
          <div className="grid gap-4">
            <ConsentStatusCard consentStatus={consentStatus} deviceId={deviceId} />
            <ExportCard deviceId={deviceId} token={deviceToken ?? ""} />
            <DeleteCard deviceId={deviceId} token={deviceToken ?? ""} onDeleted={() => setConsentStatus("denied")} />
          </div>
        ) : null}
      </main>
    </PageLayout>
  );
};

export default ConsentPage;
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAdStatus } from "@/providers/ad-status-provider";
import { IconCircleCheckFilled, IconKey, IconLoader2, IconPuzzle2, IconCircleX } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { type FormEvent, type ReactElement, useEffect, useState } from "react";

const EXT_SOURCE = "Nowly";

type RedeemState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; deviceCount?: number; maxDevices?: number }
  | { status: "error"; message: string };

let messageId = 0;
const nextId = (): string => {
  messageId += 1;
  return `redeem_${messageId}_${Date.now()}`;
};

const formatCode = (value: string): string =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/^(.{5})(.{0,4})(.{0,4})(.{0,4}).*$/, (_match, a, b, c, d) => [a, b, c, d].filter(Boolean).join("-"));

const errorKey = (error: unknown): string => {
  if (error === "device_limit_reached") return "device-limit";
  if (error === "invalid_code") return "invalid-code";
  if (error === "inactive_code") return "inactive-code";
  if (error === "network_error") return "network-error";
  return "generic-error";
};

export const RedeemSupportCard = (): ReactElement => {
  const t = useTranslations("support-redeem-page");
  const adStatus = useAdStatus();
  const [code, setCode] = useState("");
  const [extensionDetected, setExtensionDetected] = useState(false);
  const [state, setState] = useState<RedeemState>({ status: "idle" });

  useEffect(() => {
    const ping = window.setInterval(() => {
      window.postMessage({ source: EXT_SOURCE, type: "PING" }, "*");
    }, 300);
    const timeout = window.setTimeout(() => window.clearInterval(ping), 5000);

    const handler = (event: MessageEvent): void => {
      const msg = event.data ?? {};
      if (msg.type === "EXT_DETECTED") {
        setExtensionDetected(true);
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
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!extensionDetected || state.status === "submitting") return;

    const cleaned = code.trim();
    if (!cleaned) {
      setState({ status: "error", message: t("missing-code") });
      return;
    }

    const id = nextId();
    setState({ status: "submitting" });

    const handler = (messageEvent: MessageEvent): void => {
      const msg = messageEvent.data ?? {};
      if (msg.source !== EXT_SOURCE || msg.type !== "REDEEM_SUPPORT_CODE_RESULT" || msg.messageId !== id) return;

      window.removeEventListener("message", handler);
      const payload = msg.payload as { ok?: unknown; error?: unknown; deviceCount?: unknown; maxDevices?: unknown } | undefined;
      if (payload?.ok === true) {
        setState({
          status: "success",
          deviceCount: typeof payload.deviceCount === "number" ? payload.deviceCount : undefined,
          maxDevices: typeof payload.maxDevices === "number" ? payload.maxDevices : undefined,
        });
        adStatus.refresh();
        return;
      }

      setState({ status: "error", message: t(errorKey(payload?.error)) });
    };

    window.addEventListener("message", handler);
    window.postMessage({
      source: EXT_SOURCE,
      type: "REDEEM_SUPPORT_CODE",
      payload: { code: cleaned },
      messageId: id,
    }, "*");

    window.setTimeout(() => {
      window.removeEventListener("message", handler);
      setState((current) => current.status === "submitting"
        ? { status: "error", message: t("timeout") }
        : current);
    }, 10000);
  };

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <div className="mb-2 flex size-11 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
          <IconKey className="size-5" />
        </div>
        <CardTitle>{t("card-title")}</CardTitle>
        <CardDescription>{t("card-description")}</CardDescription>
      </CardHeader>

      <CardContent>
        <form className="space-y-4" onSubmit={submit}>
          <Input
            value={code}
            onChange={(event) => setCode(formatCode(event.target.value))}
            placeholder="NOWLY-XXXX-XXXX-XXXX"
            autoComplete="off"
            spellCheck={false}
            className="font-mono uppercase tracking-wide"
          />

          <Button
            type="submit"
            variant="accent"
            className="w-full"
            disabled={!extensionDetected || state.status === "submitting"}
          >
            {state.status === "submitting" ? <IconLoader2 className="size-4 animate-spin" /> : <IconKey className="size-4" />}
            {state.status === "submitting" ? t("activating") : t("activate")}
          </Button>
        </form>

        {!extensionDetected && (
          <div className="mt-4 rounded-lg border border-border bg-card-2 p-4 text-sm leading-6 text-muted-foreground">
            <div className="mb-1 flex items-center gap-2 font-semibold text-foreground">
              <IconPuzzle2 className="size-4 text-accent" />
              {t("extension-missing-title")}
            </div>
            {t("extension-missing")}
          </div>
        )}

        {state.status === "success" && (
          <div className="mt-4 rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-100">
            <div className="mb-1 flex items-center gap-2 font-semibold text-emerald-50">
              <IconCircleCheckFilled className="size-4" />
              {t("success-title")}
            </div>
            {t("success", {
              count: state.deviceCount ?? 1,
              max: state.maxDevices ?? 5,
            })}
          </div>
        )}

        {state.status === "error" && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm leading-6 text-destructive-foreground">
            <div className="mb-1 flex items-center gap-2 font-semibold">
              <IconCircleX className="size-4" />
              {t("error-title")}
            </div>
            {state.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

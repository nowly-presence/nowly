"use client";

import { ExtensionStoreButton } from "@/components/extension-store-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestExtension, subscribeExtensionDetected } from "@/lib/extension-bridge";
import { RiCheckLine, RiKey2Line } from "@remixicon/react";
import { useTranslations } from "next-intl";
import { useEffect, useState, type FormEvent } from "react";

type RedeemPayload = {
  ok?: boolean
  error?: string
  deviceCount?: number
  maxDevices?: number
};

type RedeemViewProps = {
  initialCode: string
};

const errorMessageKey = (error: string | undefined): string => {
  switch (error) {
    case "missing_code":
      return "missing-code";
    case "invalid_code":
      return "invalid-code";
    case "inactive_code":
      return "inactive-code";
    case "device_limit_reached":
      return "device-limit";
    case "network_error":
    case "database_unavailable":
    case "invalid_request":
      return "network-error";
    default:
      return "generic-error";
  }
};

export const RedeemView = ({ initialCode }: RedeemViewProps) => {
  const t = useTranslations("redeemPage");
  const [code, setCode] = useState(initialCode);
  const [detected, setDetected] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ count: number; max: number } | null>(null);

  useEffect(() => subscribeExtensionDetected(setDetected), []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextCode = code.trim();
    setSuccess(null);

    if (!nextCode) {
      setErrorKey("missing-code");
      return;
    }

    if (!detected) {
      setErrorKey("extension-missing");
      return;
    }

    setBusy(true);
    setErrorKey(null);

    try {
      const payload = await requestExtension<RedeemPayload>(
        "REDEEM_SUPPORT_CODE",
        { code: nextCode },
        12000,
      );

      if (payload?.ok === true) {
        setSuccess({
          count: typeof payload.deviceCount === "number" ? payload.deviceCount : 1,
          max: typeof payload.maxDevices === "number" ? payload.maxDevices : 1,
        });
        return;
      }

      setErrorKey(errorMessageKey(payload?.error));
    } catch (error) {
      if (error instanceof Error && error.message.includes("timed out")) {
        setErrorKey("timeout");
        return;
      }
      setErrorKey("network-error");
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

        <Card className="mt-14 max-w-xl">
          <CardContent>
            <RiKey2Line className="size-5 text-accent" />
            <CardTitle className="mt-4 text-lg">{t("card-title")}</CardTitle>
            <CardDescription className="mt-2">{t("card-description")}</CardDescription>

            {detected === false ? (
              <div className="mt-6 space-y-4">
                <p className="text-sm leading-relaxed text-foreground/80">{t("extension-missing")}</p>
                <ExtensionStoreButton />
              </div>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={(event) => void onSubmit(event)}>
                <div className="space-y-2">
                  <Label htmlFor="supporter-code" className="sr-only">
                    {t("card-title")}
                  </Label>
                  <Input
                    id="supporter-code"
                    name="code"
                    value={code}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="NOWLY-XXXX-XXXX-XXXX"
                    className="h-10 font-mono text-sm tracking-wide"
                    onChange={(event) => setCode(event.target.value)}
                  />
                </div>
                <Button type="submit" disabled={busy || detected !== true}>
                  {busy ? t("activating") : detected === null ? t("checking") : t("activate")}
                </Button>
              </form>
            )}

            {success ? (
              <p className="mt-5 flex items-start gap-2 text-sm leading-relaxed text-foreground">
                <RiCheckLine className="mt-0.5 size-4 shrink-0 text-accent" />
                {t("success", { count: success.count, max: success.max })}
              </p>
            ) : null}

            {errorKey ? (
              <p className="mt-5 text-sm leading-relaxed text-destructive">{t(errorKey)}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

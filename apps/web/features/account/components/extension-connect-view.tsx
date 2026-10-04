"use client";

import { ExtensionStoreButton } from "@/components/extension-store-button";
import { AccountHeader } from "@/features/account/components/account-header";
import {
  createExtensionSession,
  fetchAccountUser,
  signOutAccount,
  startDiscordSignIn,
  type AccountUser,
} from "@/features/account/lib/account-api";
import { requestExtension, subscribeExtensionDetected } from "@/lib/extension-bridge";
import { Button, Card, CardContent, CardDescription, CardTitle } from "@nowly/ui";
import { RiCheckLine, RiDiscordFill, RiPlugLine, RiPuzzleLine } from "@nowly/ui/icons";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Status = "checking" | "signed-out" | "no-extension" | "ready" | "connecting" | "done" | "error";

const SESSION_TIMEOUT_MS = 15000;

const StatusIcon = ({ status }: { status: Status }) => {
  const Icon = status === "done" ? RiCheckLine : status === "no-extension" ? RiPuzzleLine : status === "signed-out" ? RiDiscordFill : RiPlugLine;
  return (
    <div className="flex size-12 items-center justify-center rounded-2xl bg-foreground/6">
      <Icon className="size-6" />
    </div>
  );
};

export const ExtensionConnectView = () => {
  const t = useTranslations("extensionConnectPage");
  const searchParams = useSearchParams();
  const deviceId = searchParams.get("device");
  const fromExtension = searchParams.get("source") === "extension";
  const [status, setStatus] = useState<Status>("checking");
  const [user, setUser] = useState<AccountUser | null>(null);
  const [busy, setBusy] = useState(false);
  const autoStarted = useRef(false);

  const connect = useCallback(async (): Promise<void> => {
    setStatus("connecting");
    try {
      const session = await createExtensionSession(deviceId);
      const result = await requestExtension<{ ok?: boolean }>("NOWLY_SESSION", session, SESSION_TIMEOUT_MS);
      setStatus(result?.ok === true ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }, [deviceId]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;
    void fetchAccountUser()
      .then((current) => {
        if (cancelled) return;
        setUser(current);
        if (!current) {
          setStatus("signed-out");
          return;
        }
        unsubscribe = subscribeExtensionDetected((detected) => {
          if (cancelled) return;
          if (!detected) {
            setStatus("no-extension");
            return;
          }
          if (fromExtension && !autoStarted.current) {
            autoStarted.current = true;
            void connect();
            return;
          }
          setStatus((previous) => (previous === "checking" || previous === "no-extension" ? "ready" : previous));
        });
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [connect, fromExtension]);

  const onSignIn = async (): Promise<void> => {
    setBusy(true);
    try {
      await startDiscordSignIn(window.location.href);
    } catch {
      setBusy(false);
      setStatus("error");
    }
  };

  const onSwitchAccount = async (): Promise<void> => {
    setBusy(true);
    await signOutAccount().catch(() => undefined);
    setUser(null);
    setBusy(false);
    setStatus("signed-out");
  };

  const title =
    status === "done" ? t("done-title")
      : status === "no-extension" ? t("not-detected-title")
        : status === "signed-out" ? t("sign-in-title")
          : status === "error" ? t("error-title")
            : t("connect-title");

  const description =
    status === "done" ? t("done-description")
      : status === "no-extension" ? t("not-detected-description")
        : status === "signed-out" ? t("sign-in-description")
          : status === "error" ? t("error-description")
            : status === "checking" ? t("checking")
              : status === "connecting" ? t("connecting")
                : t("connect-description", { name: user?.name ?? "" });

  return (
    <div className="pb-24 pt-16 sm:pb-32 sm:pt-24">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-10">
        <AccountHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

        <Card className="mt-14 max-w-xl">
          <CardContent>
            <StatusIcon status={status} />
            <CardTitle className="mt-4 text-lg">{title}</CardTitle>
            <CardDescription className="mt-2">{description}</CardDescription>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {status === "signed-out" ? (
                <Button disabled={busy} onClick={onSignIn}>
                  <RiDiscordFill data-icon="inline-start" />
                  {t("sign-in")}
                </Button>
              ) : null}
              {status === "ready" ? <Button onClick={connect}>{t("connect")}</Button> : null}
              {status === "connecting" ? <Button disabled>{t("connect")}</Button> : null}
              {status === "error" ? (
                <Button variant="outline" onClick={() => window.location.reload()}>
                  {t("retry")}
                </Button>
              ) : null}
              {status === "no-extension" ? <ExtensionStoreButton variant="outline" /> : null}
            </div>

            {user && (status === "ready" || status === "done") ? (
              <p className="mt-6 text-xs text-muted-foreground">
                {t("signed-in-as", { name: user.name })}{" "}
                <Button variant="link" size="sm" disabled={busy} onClick={onSwitchAccount} className="h-auto p-0 text-xs text-muted-foreground">
                  {t("switch-account")}
                </Button>
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

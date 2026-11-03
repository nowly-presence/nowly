"use client";

import { AccountHeader } from "@/features/account/components/account-header";
import { createExtensionSession, fetchAccountUser, signOutAccount, startDiscordSignIn, type AccountUser } from "@/features/account/lib/account-api";
import { siteBaseUrl } from "@/lib/api-base";
import { requestExtension, subscribeExtensionDetected } from "@/lib/extension-bridge";
import type { ExtensionTokenScope } from "@nowly/shared";
import { buttonVariants, Button, Card, CardContent, CardDescription, CardTitle } from "@nowly/ui";
import { RiCheckLine, RiDiscordFill, RiPlugLine, RiPuzzleLine } from "@nowly/ui/icons";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Status = "checking" | "signed-out" | "no-extension" | "ready" | "connecting" | "done" | "error" | "forbidden";

const SESSION_TIMEOUT_MS = 15000;

const StatusIcon = ({ status }: {
  status: Status;
}) => {
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
  const permission = searchParams.get("permission");
  const creator = permission === "creator";
  const admin = permission === "admin";
  const scopesFor = useCallback((staff: boolean): ExtensionTokenScope[] => [
    "sync",
    ...(creator ? (["creator"] as const) : []),
    ...(admin || staff ? (["admin"] as const) : [])
  ], [creator, admin]);
  const [status, setStatus] = useState<Status>("checking");
  const [user, setUser] = useState<AccountUser | null>(null);
  const [busy, setBusy] = useState(false);
  const autoStarted = useRef(false);

  const connect = useCallback(async (staff: boolean): Promise<void> => {
    setStatus("connecting");

    try {
      const session = await createExtensionSession(deviceId, scopesFor(staff));

      const result = await requestExtension<{
        ok?: boolean;
      }>("NOWLY_SESSION", session, SESSION_TIMEOUT_MS);
      setStatus(result?.ok === true ? "done" : "error");
    } catch (failure) {
      setStatus(failure instanceof Error && failure.message === "ADMIN_REQUIRED" ? "forbidden" : "error");
    }
  }, [deviceId, scopesFor]);

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
          if (admin && !current.capabilities.length) {
            setStatus("forbidden");
            return;
          }
          if (fromExtension && !creator && !admin && !autoStarted.current) {
            autoStarted.current = true;
            void connect(current.capabilities.length > 0);
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
  }, [connect, fromExtension, creator, admin]);

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
    status === "done"
      ? t("done-title")
      : status === "no-extension"
        ? t("not-detected-title")
        : status === "signed-out"
          ? t("sign-in-title")
          : status === "forbidden"
            ? t("forbidden-title")
            : status === "error"
              ? t("error-title")
              : t("connect-title");

  const description =
    status === "done"
      ? t("done-description")
      : status === "no-extension"
        ? t("not-detected-description")
        : status === "signed-out"
          ? t("sign-in-description")
          : status === "forbidden"
            ? t("forbidden-description")
            : status === "error"
              ? t("error-description")
              : status === "checking"
                ? t("checking")
                : status === "connecting"
                  ? t("connecting")
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
            {creator && status !== "done" && <CardDescription className="mt-2">{t("creator-permission")}</CardDescription>}
            {admin && status !== "done" && status !== "forbidden" && <CardDescription className="mt-2">{t("admin-permission")}</CardDescription>}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {status === "signed-out" ? (
                <Button disabled={busy} onClick={onSignIn}>
                  <RiDiscordFill data-icon="inline-start" />
                  {t("sign-in")}
                </Button>
              ) : null}
              {status === "ready" ? <Button onClick={() => void connect((user?.capabilities.length ?? 0) > 0)}>{t("connect")}</Button> : null}
              {status === "connecting" ? <Button disabled>{t("connect")}</Button> : null}
              {status === "error" ? (
                <Button variant="outline" onClick={() => window.location.reload()}>
                  {t("retry")}
                </Button>
              ) : null}
              {status === "no-extension" ? (
                <a href={`${siteBaseUrl()}/extension`} className={buttonVariants({ variant: "outline" })}>
                  {t("get-extension")}
                </a>
              ) : null}
            </div>

            {user && (status === "ready" || status === "done" || status === "forbidden") ? (
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
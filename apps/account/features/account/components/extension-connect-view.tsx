"use client";

import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthFrame } from "@/features/auth/components/auth-frame";
import { NowlyMark } from "@/features/auth/components/nowly-mark";
import { createExtensionSession, fetchAccountUser, signOutAccount, startDiscordSignIn, type AccountUser } from "@/features/account/lib/account-api";
import { siteBaseUrl } from "@/lib/api-base";
import { requestExtension, subscribeExtensionDetected } from "@nowly/shared/web-bridge";
import type { ExtensionTokenScope } from "@nowly/shared";
import { buttonVariants, Button } from "@nowly/ui";
import { RiCheckLine, RiDiscordFill, RiPuzzleLine } from "@nowly/ui/icons";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Status = "checking" | "signed-out" | "no-extension" | "ready" | "connecting" | "done" | "error" | "forbidden";

export const ExtensionConnectView = () => {
  const t = useTranslations("extensionConnectPage");
  const searchParams = useSearchParams();
  const deviceId = searchParams.get("device");
  const fromExtension = searchParams.get("source") === "extension";
  const expectedUser = searchParams.get("user");
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
      }>("NOWLY_SESSION", session);
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

  const mismatch = status === "ready" && user !== null && expectedUser !== null && user.id !== expectedUser;

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
                  : mismatch
                    ? t("mismatch-description", { name: user?.name ?? "" })
                    : t("connect-description", { name: user?.name ?? "" });

  const showPermissions = status === "ready" || status === "connecting";
  const permissions = showPermissions
    ? [
        t("perm-identity"),
        t("perm-sync"),
        ...(creator ? [t("perm-creator")] : []),
        ...(admin ? [t("perm-admin")] : []),
        t("perm-revoke")
      ]
    : status === "signed-out"
      ? [
          t("perm-name"),
          t("perm-private")
        ]
      : [];
  const linked = status === "done" ? <RiCheckLine className="size-6" /> : <RiPuzzleLine className="size-6" />;

  return (
    <AuthFrame>
      <AuthCard mark={<NowlyMark />} linked={linked} title={title} description={description} permissions={permissions}>
        <div className="flex flex-col gap-2">
          {status === "signed-out" ? (
            <Button size="lg" disabled={busy} onClick={onSignIn}>
              <RiDiscordFill data-icon="inline-start" />
              {t("sign-in")}
            </Button>
          ) : null}
          {status === "ready" || status === "connecting" ? (
            <div className="flex gap-3">
              <Button size="lg" variant="outline" className="flex-1" disabled={status === "connecting"} onClick={() => window.location.assign(siteBaseUrl())}>
                {t("deny")}
              </Button>
              <Button size="lg" className="flex-1" disabled={status === "connecting"} onClick={() => void connect((user?.capabilities.length ?? 0) > 0)}>
                {t("connect")}
              </Button>
            </div>
          ) : null}
          {status === "error" ? (
            <Button size="lg" variant="outline" onClick={() => window.location.reload()}>
              {t("retry")}
            </Button>
          ) : null}
          {status === "no-extension" ? (
            <a
              href={`${siteBaseUrl()}/extension`}
              className={buttonVariants({
                variant: "outline",
                size: "lg"
              })}
            >
              {t("get-extension")}
            </a>
          ) : null}
        </div>
        {user && (status === "ready" || status === "done" || status === "forbidden") ? (
          <p className="text-center text-xs text-muted-foreground">
            {t("signed-in-as", { name: user.name })}{" "}
            <Button variant="link" size="sm" disabled={busy} onClick={onSwitchAccount} className="h-auto p-0 text-xs text-muted-foreground">
              {t("switch-account")}
            </Button>
          </p>
        ) : null}
      </AuthCard>
    </AuthFrame>
  );
};
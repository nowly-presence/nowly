"use client";

import { AccountHeader } from "@/features/account/components/account-header";
import {
  deleteAccount,
  downloadAccountExport,
  fetchAccountDevices,
  fetchAccountUser,
  signOutAccount,
  startDiscordSignIn,
  unlinkAccountDevice,
  type AccountDevice,
  type AccountUser,
} from "@/features/account/lib/account-api";
import { Avatar, AvatarFallback, AvatarImage, Button, Card, CardContent, CardDescription, CardTitle, Separator } from "@nowly/ui";
import { RiDeleteBinLine, RiDiscordFill, RiDownload2Line, RiLogoutBoxRLine } from "@nowly/ui/icons";
import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

type Status = "checking" | "signed-out" | "ready" | "deleted" | "error";
type Message = "exported" | "error" | null;

const DeviceRow = ({ device, onUnlink, busy }: { device: AccountDevice; onUnlink: (deviceId: string) => void; busy: boolean }) => {
  const t = useTranslations("accountPage");
  const format = useFormatter();
  const name = [device.browser, device.os].filter(Boolean).join(", ") || t("device-unknown");
  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">
          {t("device-last-seen", { date: format.dateTime(new Date(device.lastSeenAt), { dateStyle: "medium" }) })}
        </p>
      </div>
      <Button variant="outline" size="sm" disabled={busy} onClick={() => onUnlink(device.deviceId)}>
        {t("unlink")}
      </Button>
    </li>
  );
};

export const AccountView = () => {
  const t = useTranslations("accountPage");
  const [status, setStatus] = useState<Status>("checking");
  const [user, setUser] = useState<AccountUser | null>(null);
  const [devices, setDevices] = useState<AccountDevice[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      const current = await fetchAccountUser();
      setUser(current);
      if (!current) {
        setStatus("signed-out");
        return;
      }
      setDevices(await fetchAccountDevices());
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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

  const onSignIn = () => run(() => startDiscordSignIn(window.location.href));

  const onUnlink = (deviceId: string) => {
    if (!window.confirm(t("unlink-confirm"))) return;
    void run(async () => {
      await unlinkAccountDevice(deviceId);
      setDevices((current) => current.filter((device) => device.deviceId !== deviceId));
    });
  };

  const onExport = () => run(async () => {
    await downloadAccountExport();
    setMessage("exported");
  });

  const onSignOut = () => run(async () => {
    await signOutAccount();
    setUser(null);
    setStatus("signed-out");
  });

  const onDelete = () => {
    if (!window.confirm(t("delete-confirm"))) return;
    void run(async () => {
      await deleteAccount();
      await signOutAccount().catch(() => undefined);
      setUser(null);
      setStatus("deleted");
    });
  };

  return (
    <div className="pb-24 pt-16 sm:pb-32 sm:pt-24">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-10">
        <AccountHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

        {status === "checking" ? <p className="mt-14 text-sm text-muted-foreground">{t("checking")}</p> : null}

        {status === "error" ? <p className="mt-14 text-sm text-destructive">{t("action-error")}</p> : null}

        {status === "deleted" ? <p className="mt-14 text-sm text-muted-foreground">{t("delete-success")}</p> : null}

        {status === "signed-out" ? (
          <Card className="mt-14 max-w-xl">
            <CardContent>
              <CardTitle className="text-lg">{t("sign-in-title")}</CardTitle>
              <CardDescription className="mt-2">{t("sign-in-description")}</CardDescription>
              <Button className="mt-6" disabled={busy} onClick={onSignIn}>
                <RiDiscordFill data-icon="inline-start" />
                {t("sign-in")}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {status === "ready" && user ? (
          <div className="mt-14 flex max-w-xl flex-col gap-6">
            <Card>
              <CardContent>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar>
                      {user.image ? <AvatarImage src={user.image} alt="" /> : null}
                      <AvatarFallback>{user.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <CardTitle className="truncate text-lg">{user.name}</CardTitle>
                      <CardDescription>{t("provider-discord")}</CardDescription>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled={busy} onClick={onSignOut}>
                    <RiLogoutBoxRLine data-icon="inline-start" />
                    {t("sign-out")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <CardTitle className="text-lg">{t("devices-title")}</CardTitle>
                <CardDescription className="mt-2">{t("devices-description")}</CardDescription>
                {devices.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">{t("devices-empty")}</p>
                ) : (
                  <ul className="mt-2 divide-y divide-border">
                    {devices.map((device) => (
                      <DeviceRow key={device.deviceId} device={device} busy={busy} onUnlink={onUnlink} />
                    ))}
                  </ul>
                )}
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
                <Separator className="my-6" />
                <p className="text-xs text-muted-foreground">{t("local-note")}</p>
                {message === "exported" ? <p className="mt-3 text-sm text-muted-foreground">{t("export-success")}</p> : null}
                {message === "error" ? <p className="mt-3 text-sm text-destructive">{t("action-error")}</p> : null}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
};

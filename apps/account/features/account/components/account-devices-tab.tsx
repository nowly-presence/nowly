"use client";

import type { AccountDevice } from "@/features/account/lib/account-api";
import { Button, Card, CardContent, CardDescription, CardTitle } from "@nowly/ui";
import { useFormatter, useTranslations } from "next-intl";

const DeviceRow = ({ device, onUnlink, busy }: {
  device: AccountDevice;
  onUnlink: (deviceId: string) => void;
  busy: boolean;
}) => {
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

export const AccountDevicesTab = ({ devices, busy, error, onUnlink }: {
  devices: AccountDevice[];
  busy: boolean;
  error: boolean;
  onUnlink: (deviceId: string) => void;
}) => {
  const t = useTranslations("accountPage");
  return (
    <Card className="max-w-xl">
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
        {error ? <p className="mt-3 text-sm text-destructive">{t("action-error")}</p> : null}
      </CardContent>
    </Card>
  );
};
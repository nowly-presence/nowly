"use client";

import { Frame } from "@/features/shell/components/frame";
import type { AccountDevice } from "@/features/account/lib/account-api";
import { browserPlatform, systemPlatform } from "@/features/account/lib/device-platform";
import { Button } from "@nowly/ui";
import { RiGlobalFill } from "@nowly/ui/icons";
import { useFormatter, useTranslations } from "next-intl";

const DeviceRow = ({ device, onUnlink, busy }: {
  device: AccountDevice;
  onUnlink: (deviceId: string) => void;
  busy: boolean;
}) => {
  const t = useTranslations("accountPage");
  const format = useFormatter();
  const browser = browserPlatform(device.browser);
  const system = systemPlatform(device.os);
  const BrowserIcon = browser?.icon ?? RiGlobalFill;
  const name =
    browser && system
      ? t("device-label", {
          browser: browser.label,
          os: system.label
        })
      : (browser?.label ?? system?.label ?? t("device-unknown"));
  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
          <BrowserIcon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">
            {t("device-last-seen", { date: format.dateTime(new Date(device.lastSeenAt), { dateStyle: "medium" }) })}
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" disabled={busy} onClick={() => onUnlink(device.deviceId)}>
        {t("unlink")}
      </Button>
    </li>
  );
};

export const AccountDevicesTab = ({ devices, busy, error, onUnlink, onUnlinkAll }: {
  devices: AccountDevice[];
  busy: boolean;
  error: boolean;
  onUnlink: (deviceId: string) => void;
  onUnlinkAll: () => void;
}) => {
  const t = useTranslations("accountPage");
  return (
    <Frame
      className="max-w-xl"
      title={t("devices-title")}
      description={t("devices-description")}
      action={
        devices.length > 1 ? (
          <Button variant="outline" size="sm" disabled={busy} onClick={onUnlinkAll}>
            {t("devices-unlink-all")}
          </Button>
        ) : undefined
      }
      padded={devices.length === 0}
    >
      {devices.length === 0 ? <p className="text-sm text-muted-foreground">{t("devices-empty")}</p> : null}
      {devices.length > 0 ? (
        <ul className="divide-y divide-border px-4">
          {devices.map((device) => (
            <DeviceRow key={device.deviceId} device={device} busy={busy} onUnlink={onUnlink} />
          ))}
        </ul>
      ) : null}
      {error ? <p className="px-4 py-3 text-sm text-destructive">{t("action-error")}</p> : null}
    </Frame>
  );
};
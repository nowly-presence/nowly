"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AppleIcon, LinuxIcon, WindowsIcon } from "@/components/icons";
import { ShieldCheck, ShieldX } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePlatform } from "@/hooks/use-platform";
import { CDN_INSTALLER_BASE_URL, HOST_VERSION_URL } from "@/lib/constants";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";
import { useEffect, useState } from "react";
import { HostDownload } from "./host-download";
import { HostGuide } from "./host-guide";
import { HostHero } from "./host-hero";
import { HostRequirements } from "./host-requirements";
import { HostTrust } from "./host-trust";

const platformKeys = ["windows", "macos", "linux"] as const;

export const HostContent: FC = (): ReactElement => {
  const detectedPlatform = usePlatform();
  const [manualPlatform, setManualPlatform] = useState<(typeof platformKeys)[number] | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const t = useTranslations("host-page");

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    fetch(HOST_VERSION_URL, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("failed to fetch host version");
        return r.json() as Promise<{ version: string }>;
      })
      .then((data) => setVersion(data.version))
      .catch(() => setVersion(null))
      .finally(() => clearTimeout(timeout));

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  const platformConfig = {
    windows: {
      icon: WindowsIcon,
      label: "Windows",
      details: t("windows-details"),
      downloads: [
        { label: t("win-download-installer"), url: `${CDN_INSTALLER_BASE_URL}/nowly-setup.exe` },
        { label: t("win-download-portable"), url: `${CDN_INSTALLER_BASE_URL}/nowly-windows.zip` },
      ],
    },
    macos: {
      icon: AppleIcon,
      label: "macOS",
      details: t("macos-details"),
      downloads: [
        { label: t("macos-download"), url: `${CDN_INSTALLER_BASE_URL}/nowly-macos.dmg` },
      ],
    },
    linux: {
      icon: LinuxIcon,
      label: "Linux",
      details: t("linux-details"),
      downloads: [
        { label: t("download-archive"), url: `${CDN_INSTALLER_BASE_URL}/nowly-linux.tar.gz` },
      ],
    },
  };

  const activePlatform = manualPlatform ?? (detectedPlatform || "windows");
  const config = platformConfig[activePlatform];

  return (
    <>
      <HostHero />

      <section className="mb-14 flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col gap-2 sm:items-start">
          <Select
            value={activePlatform}
            onValueChange={(value) => setManualPlatform(value as (typeof platformKeys)[number])}
          >
            <SelectTrigger className="min-w-44" aria-label={t("platform-select-label")}>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {platformKeys.map((key) => {
                const item = platformConfig[key];
                const Icon = item.icon;

                return (
                  <SelectItem key={key} value={key}>
                    <Icon className="size-4" />
                    {item.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <p className="text-sm text-muted-foreground">
            {t("card-version", { version: version ?? "latest", details: config.details })}
          </p>
          </div>

          <HostDownload config={config} layout="inline" />
        </div>

        {activePlatform === "windows" && (
          <Alert variant="destructive">
            <ShieldX />
            <AlertTitle>{t("unsigned-title")}</AlertTitle>
            <AlertDescription>{t("unsigned-desc")}</AlertDescription>
          </Alert>
        )}

        {activePlatform === "macos" && (
          <Alert>
            <ShieldCheck />
            <AlertTitle>{t("signed-title")}</AlertTitle>
            <AlertDescription>{t("signed-desc")}</AlertDescription>
          </Alert>
        )}
      </section>

      <HostTrust />
      <HostGuide platform={activePlatform} />
      <HostRequirements platform={activePlatform} />
    </>
  );
};
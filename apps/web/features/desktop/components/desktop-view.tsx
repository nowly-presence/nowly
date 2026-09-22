"use client";

import { ButtonLink } from "@/components/button-link";
import { CampaignSignupForm } from "@/features/campaigns/components/campaign-signup-form";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  ButtonAnchor,
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  cn,
} from "@nowly/ui";


import { CHROMEOS_WAITLIST_CAMPAIGN_ID, PROJECT_REPOSITORY_URL } from "@/lib/constants";
import type { DesktopPlatform, DesktopRelease } from "@/features/desktop/lib/desktop-release";

import {
  RiAppleFill,
  RiCheckLine,
  RiChromeFill,
  RiErrorWarningLine,
  RiGithubLine,
  RiInformationLine,
  RiUbuntuFill,
  RiWindowsFill,
} from "@nowly/ui/icons";
import { useTranslations } from "next-intl";
import { useLayoutEffect, useState } from "react";

const platforms = ["windows", "macos", "linux", "chromeos"] as const;

const platformIcons = {
  windows: RiWindowsFill,
  macos: RiAppleFill,
  linux: RiUbuntuFill,
  chromeos: RiChromeFill,
};

type Platform = DesktopPlatform | "chromeos";

const detectPlatform = (): Platform => {
  const ua = navigator.userAgent;
  if (/CrOS/i.test(ua)) return "chromeos";
  if (/Mac/i.test(ua) && !/iPhone|iPad/i.test(ua)) return "macos";
  if (/Linux/i.test(ua) && !/Android/i.test(ua)) return "linux";
  return "windows";
};

type DesktopViewProps = {
  release: DesktopRelease
};

export const DesktopView = ({ release }: DesktopViewProps) => {
  const t = useTranslations("desktopPage");
  const [platform, setPlatform] = useState<Platform>("windows");
  const [detected, setDetected] = useState<Platform | null>(null);
  const Icon = platformIcons[platform];
  const downloads = platform === "chromeos" ? [] : platformDownloads(release, platform, {
    windowsInstaller: t("windows-installer"),
    windowsPortable: t("windows-portable"),
    macosDmg: t("macos-dmg"),
    macosArchive: t("macos-archive"),
    linuxDeb: t("linux-deb"),
    linuxArchive: t("linux-archive"),
  });
  const trustItems = t.raw("trust-items") as Array<{ title: string; text: string }>;
  const guideItems = t.raw("guide-items") as Array<{ title: string; text: string }>;
  const requirementKeys = ["os", "arch", "discord", "browser", "storage"] as const;

  useLayoutEffect(() => {
    const next = detectPlatform();
    setDetected(next);
    setPlatform(next);
  }, []);

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

        <div className="mt-10 flex flex-wrap gap-2">
          {platforms.map((key) => {
            const PlatformIcon = platformIcons[key];
            const active = key === platform;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setPlatform(key)}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-full px-3.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-foreground text-background"
                    : "bg-foreground/5 text-foreground/80 hover:bg-foreground/9 hover:text-foreground",
                )}
              >
                <PlatformIcon className="size-4" />
                {t(`platforms.${key}`)}
                {detected === key ? (
                  <span className="inline-flex items-center gap-1 text-[0.65rem] uppercase tracking-wide opacity-80">
                    <RiCheckLine className="size-3" />
                    {t("detected")}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <Card className="mt-8 max-w-xl py-8">
          <CardContent className="flex flex-col items-start gap-5">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-foreground/6">
              <Icon className="size-6" />
            </div>
            <div>
              <CardTitle className="text-xl">
                {platform === "chromeos" ? t("chromeos-title") : t("card-title", { platform: t(`platforms.${platform}`) })}
              </CardTitle>
              {platform !== "chromeos" && release.version ? (
                <CardDescription className="mt-1">
                  {t("version", { version: release.version })}
                </CardDescription>
              ) : null}
              {platform === "chromeos" ? (
                <CardDescription className="mt-1">{t("chromeos-description")}</CardDescription>
              ) : null}
            </div>

            {platform === "chromeos" ? (
              CHROMEOS_WAITLIST_CAMPAIGN_ID ? (
                <CampaignSignupForm
                  campaignId={CHROMEOS_WAITLIST_CAMPAIGN_ID}
                  placeholder={t("chromeos-email-placeholder")}
                  submitLabel={t("chromeos-submit")}
                  successLabel={t("chromeos-success")}
                  errorLabel={t("chromeos-error")}
                />
              ) : null
            ) : (
              <div className="flex w-full flex-col gap-2">
                {downloads.map((item, index) => (
                  <ButtonAnchor
                    key={item.href}
                    href={item.href}
                    variant={index === 0 ? "inverted" : "outline"}
                    size="lg"
                    className="w-full"
                  >
                    {item.label}
                  </ButtonAnchor>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <ButtonAnchor
                href={PROJECT_REPOSITORY_URL}
                rel="noreferrer"
                target="_blank"
                variant="link"
                size="sm"
                className="h-auto px-0"
              >
                <RiGithubLine data-icon="inline-start" />
                {t("open-source")}
              </ButtonAnchor>
              <span>{t("lightweight")}</span>
            </div>
            {platform === "windows" ? (
              <Alert variant="destructive" className="w-full min-w-0">
                <RiErrorWarningLine />
                <AlertTitle>{t("unsigned-title")}</AlertTitle>
                <AlertDescription>{t("unsigned-desc")}</AlertDescription>
              </Alert>
            ) : null}
            {platform === "macos" ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">{t("signed-title")}. </span>
                {t("signed-desc")}
              </p>
            ) : null}
            {platform === "linux" ? (
              <Alert variant="info" className="w-full min-w-0">
                <RiInformationLine />
                <AlertTitle>{t("linux-title")}</AlertTitle>
                <AlertDescription className="min-w-0">
                  {t("linux-desc")}
                  <div className="mt-3 min-w-0 overflow-hidden rounded-[10px] bg-code-surface shadow-[0_0_0_1px_var(--border)]">
                    <pre className="max-w-full overflow-x-auto p-3 font-mono text-[12.5px] leading-[1.7] text-foreground">
                      <code>{"tar -xzf nowly-linux.tar.gz && ./scripts/install-linux.sh nowly-host-linux"}</code>
                    </pre>
                  </div>
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>

        <section className="mt-16 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-medium tracking-tight">{t("trust-title")}</h2>
            <ul className="mt-6 space-y-5">
              {trustItems.map((item) => (
                <li key={item.title}>
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-medium tracking-tight">{t("guide-title")}</h2>
            <ol className="mt-6 space-y-5">
              {guideItems.map((item, index) => (
                <li key={item.title} className="flex gap-4">
                  <span className="mt-0.5 font-mono text-xs font-medium text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                    {index === 2 ? (
                      <ButtonLink href="/library" variant="link" size="sm" className="mt-2 h-auto px-0">
                        {t("guide-library")}
                      </ButtonLink>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {platform !== "chromeos" ? (
          <section className="mt-16 max-w-3xl">
            <h2 className="text-xl font-medium tracking-tight">{t("req-title")}</h2>
            <div className="mt-6 divide-y divide-border overflow-hidden rounded-[16px] border border-border bg-foreground/4">
              {requirementKeys.map((key) => (
                <div
                  key={key}
                  className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-sm text-muted-foreground">{t(`req.${key}`)}</span>
                  <span className="text-sm font-medium">{t(`req.${key}-${platform}`)}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
};

const platformDownloads = (
  release: DesktopRelease,
  platform: DesktopPlatform,
  labels: {
    windowsInstaller: string
    windowsPortable: string
    macosDmg: string
    macosArchive: string
    linuxDeb: string
    linuxArchive: string
  },
) => {
  if (platform === "windows") {
    return [
      { href: release.windows.installer, label: labels.windowsInstaller },
      { href: release.windows.portable, label: labels.windowsPortable },
    ];
  }
  if (platform === "macos") {
    const items = [{ href: release.macos.dmg, label: labels.macosDmg }];
    if (release.macos.archive) items.push({ href: release.macos.archive, label: labels.macosArchive });
    return items;
  }
  const items = [];
  if (release.linux.deb) items.push({ href: release.linux.deb, label: labels.linuxDeb });
  items.push({ href: release.linux.archive, label: labels.linuxArchive });
  return items;
};

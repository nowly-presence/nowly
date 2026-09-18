"use client";

import { ButtonAnchor, Card, CardContent, CardDescription, CardTitle, cn } from "@nowly/ui";


import { BRAND_LOCKUP_CANARY, CANARY_ACCENT, CANARY_INK } from "@/lib/brand";
import {
  CANARY_EXTENSION_ZIP_URL,
  CANARY_FIREFOX_ZIP_URL,
  FIREFOX_EXTENSION_DOWNLOAD_URL,
  PROJECT_EXTENSION_DOWNLOAD_URL,
} from "@/lib/constants";
import { detectExtensionBrowser, type ExtensionBrowser } from "@/lib/extension-store";

import { RiCheckLine, RiChromeFill, RiDownloadLine, RiFirefoxFill } from "@nowly/ui/icons";
import { useTranslations } from "next-intl";
import { useLayoutEffect, useState } from "react";

const browsers = ["chrome", "firefox"] as const;

const browserIcons = {
  chrome: RiChromeFill,
  firefox: RiFirefoxFill,
};

const zipUrl: Record<ExtensionBrowser, string> = {
  chrome: CANARY_EXTENSION_ZIP_URL,
  firefox: CANARY_FIREFOX_ZIP_URL,
};

const storeUrl: Record<ExtensionBrowser, string> = {
  chrome: PROJECT_EXTENSION_DOWNLOAD_URL,
  firefox: FIREFOX_EXTENSION_DOWNLOAD_URL,
};

export const CanaryView = () => {
  const t = useTranslations("canaryPage");
  const [browser, setBrowser] = useState<ExtensionBrowser>("chrome");
  const [detected, setDetected] = useState<ExtensionBrowser | null>(null);
  const Icon = browserIcons[browser];
  const notes = t.raw("notes") as Array<{ title: string; text: string }>;
  const guideItems = t.raw(`guide.${browser}`) as Array<{ title: string; text: string }>;

  useLayoutEffect(() => {
    const next = detectExtensionBrowser();
    setDetected(next);
    setBrowser(next);
  }, []);

  return (
    <div className="pb-24 pt-16 sm:pb-32 sm:pt-24">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-10">
        <header className="max-w-xl">
          <p
            className="mb-3 inline-flex rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium uppercase tracking-[0.2em]"
            style={{ backgroundColor: CANARY_ACCENT, color: CANARY_INK }}
          >
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 text-pretty text-[2.2rem] font-medium leading-[1.08] tracking-tight text-foreground sm:text-[2.75rem]">
            {t("title")}
          </h1>
          <p className="mt-4 text-[1.05rem] leading-relaxed text-foreground/68">
            {t("description")}
          </p>
        </header>

        <div className="mt-10 flex flex-wrap gap-2">
          {browsers.map((key) => {
            const BrowserIcon = browserIcons[key];
            const active = key === browser;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setBrowser(key)}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-full px-3.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-foreground text-background"
                    : "bg-foreground/5 text-foreground/80 hover:bg-foreground/9 hover:text-foreground",
                )}
              >
                <BrowserIcon className="size-4" />
                {t(`browsers.${key}`)}
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
            <img
              src={BRAND_LOCKUP_CANARY}
              alt="Nowly Canary"
              width={160}
              height={40}
              className="h-10 w-auto brightness-0 dark:brightness-100"
            />
            <div>
              <CardTitle className="text-xl">
                {t("card-title", { browser: t(`browsers.${browser}`) })}
              </CardTitle>
              <CardDescription className="mt-1">{t(`card-description.${browser}`)}</CardDescription>
            </div>
            <div className="flex w-full flex-col gap-2">
              <ButtonAnchor
                href={zipUrl[browser]}
                variant="inverted"
                size="lg"
                className="w-full border-transparent hover:brightness-110"
                style={{ backgroundColor: CANARY_ACCENT, color: CANARY_INK }}
              >
                <RiDownloadLine data-icon="inline-start" />
                {t("download")}
              </ButtonAnchor>
              <ButtonAnchor
                href={storeUrl[browser]}
                rel="noreferrer"
                target="_blank"
                variant="outline"
                size="lg"
                className="w-full"
              >
                <Icon data-icon="inline-start" />
                {t(`stable.${browser}`)}
              </ButtonAnchor>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{t(`store-note.${browser}`)}</p>
          </CardContent>
        </Card>

        <section className="mt-16 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-medium tracking-tight">{t("notes-title")}</h2>
            <ul className="mt-6 space-y-5">
              {notes.map((item) => (
                <li key={item.title}>
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-medium tracking-tight">{t(`guide-title.${browser}`)}</h2>
            <ol className="mt-6 space-y-5">
              {guideItems.map((item, index) => (
                <li key={item.title} className="flex gap-4">
                  <span
                    className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md font-mono text-[0.65rem] font-medium"
                    style={{ backgroundColor: CANARY_ACCENT, color: CANARY_INK }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
};

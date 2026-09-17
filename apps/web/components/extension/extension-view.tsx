"use client";

import { ButtonAnchor, ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { detectExtensionBrowser, getExtensionDownloadUrl } from "@/lib/extension-store";
import type { ExtensionBrowser } from "@/lib/extension-store";
import { cn } from "@/lib/utils";
import { RiCheckLine, RiChromeFill, RiFirefoxBrowserFill } from "@remixicon/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useLayoutEffect, useState } from "react";

const browsers = ["chrome", "firefox"] as const;

const browserIcons = {
  chrome: RiChromeFill,
  firefox: RiFirefoxBrowserFill,
};

export const ExtensionView = () => {
  const t = useTranslations("extensionPage");
  const [browser, setBrowser] = useState<ExtensionBrowser>("chrome");
  const [detected, setDetected] = useState<ExtensionBrowser | null>(null);
  const Icon = browserIcons[browser];
  const trustItems = t.raw("trust-items") as Array<{ title: string; text: string }>;
  const guideItems = t.raw("guide-items") as Array<{ title: string; text: string }>;

  useLayoutEffect(() => {
    const next = detectExtensionBrowser();
    setDetected(next);
    setBrowser(next);
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
            <div className="flex size-12 items-center justify-center rounded-2xl bg-foreground/6">
              <Icon className="size-6" />
            </div>
            <div>
              <CardTitle className="text-xl">
                {t("card-title", { browser: t(`browsers.${browser}`) })}
              </CardTitle>
              <CardDescription className="mt-1">{t(`card-description.${browser}`)}</CardDescription>
            </div>
            <div className="flex w-full flex-col gap-2">
              <ButtonAnchor
                href={getExtensionDownloadUrl(browser)}
                rel="noreferrer"
                target="_blank"
                variant="inverted"
                size="lg"
                className="w-full"
              >
                <Icon data-icon="inline-start" />
                {t("card-title", { browser: t(`browsers.${browser}`) })}
              </ButtonAnchor>
            </div>
            <Link
              href="/canary"
              className="text-sm text-muted-foreground underline decoration-foreground/20 underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground/50"
            >
              {t("dev-version")}
            </Link>
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
                    {index === 1 ? (
                      <ButtonLink href="/desktop" variant="link" size="sm" className="mt-2 h-auto px-0">
                        {t("guide-desktop")}
                      </ButtonLink>
                    ) : null}
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
      </div>
    </div>
  );
};

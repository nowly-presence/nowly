"use client";

import { SponsorModal } from "@/components/l-ui/sponsor-modal";
import { Button } from "@/components/ui/button";
import { useBrowser } from "@/hooks/use-browser";
import { IconCircleCheck, IconDownload, IconDeviceDesktop, IconShield } from "@tabler/icons-react";
import { useTranslations } from "next-intl";

import type { FC, ReactElement } from "react";
import { useState } from "react";

export const CtaSection: FC = (): ReactElement => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const browser = useBrowser();
  const t = useTranslations("cta-section");

  const handleDownload = (): void => {
    setIsModalOpen(true);
  };

  return (
    <>
      <section id="download" className="py-24">
        <div className="relative z-2 mx-auto w-full max-w-300 min-w-0 px-6">
          {/* Desktop CTA */}
          <div className="hidden min-w-0 rounded-xl border border-border bg-linear-to-b from-card to-surface p-8 text-center md:block md:p-16">
            <h2 className="mb-4 text-balance text-[2rem] font-extrabold tracking-tight md:text-[2.5rem]">
              {t("title")}
            </h2>

            <p className="mx-auto mb-8 max-w-md text-balance text-muted-foreground">
              {t("description")}
            </p>
            
            <div className="flex min-w-0 flex-wrap items-stretch justify-center gap-4">
              <Button onClick={handleDownload} variant="primary" size="lg">
                <IconDownload className="w-5 h-5" />
                {browser ? t("download-for", { browser }) : t("download-desktop")}
              </Button>

              <Button disabled variant="secondary" size="lg">
                <img
                  src="https://thesvg.org/icons/firefox/default.svg"
                  alt="Firefox"
                  width={16}
                  height={16}
                  className="w-4 h-4"
                />

                Firefox

                <span className="ml-2 text-xs text-muted rounded-sm px-1.5 py-0.5 bg-muted-foreground border border-muted">
                  {t("firefox-status")}
                </span>
              </Button>
            </div>

            <div className="mt-8 flex min-w-0 flex-wrap justify-center gap-6">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <img
                  src="https://thesvg.org/icons/chromium/default.svg"
                  alt="Chromium"
                  width={16}
                  height={16}
                  className="w-4 h-4"
                />
                {t("platforms")}
              </div>

              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <IconShield className="w-4 h-4" />
                {t("open-source")}
              </div>

              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <IconCircleCheck className="w-4 h-4" />
                {t("free")}
              </div>
            </div>
          </div>

          {/* Mobile: desktop-only overlay */}
          <div className="md:hidden relative overflow-hidden rounded-xl">
            <div className="absolute inset-0 bg-linear-to-b from-card to-surface opacity-30" />
            <div className="absolute inset-0 backdrop-blur-sm" />
            <div className="relative z-10 flex flex-col items-center justify-center px-8 py-24 text-center">
              <IconDeviceDesktop className="w-16 h-16 text-accent mb-6" />
              <h2 className="text-2xl font-bold tracking-tight mb-3 text-foreground">
                Version desktop uniquement
              </h2>
              <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
                L'extension Nowly est conçue pour les navigateurs de bureau. Pour profiter de Discord Rich Presence, installe-la sur ton PC.
              </p>
            </div>
          </div>
        </div>
      </section>

      <SponsorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        downloadOnAction
      />
    </>
  );
};
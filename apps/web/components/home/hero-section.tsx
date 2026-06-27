"use client";

import { SponsorModal } from "@/components/l-ui/sponsor-modal";
import { buttonVariants } from "@/components/ui/button";
import HighlightedText from "@/components/ui/highlighted-text";
import { IconArrowRight } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactElement } from "react";
import { useState } from "react";
import { ExtensionPreview } from "./extension-preview";

export const HeroSection: FC = (): ReactElement => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const t = useTranslations("hero-section");

  return (
    <>
      <section className="min-h-screen flex items-center relative overflow-hidden border-b border-border">
        <div className="relative z-2 mx-auto w-full max-w-300 min-w-0 px-6">
          <div className="grid min-w-0 grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_480px]">
            {/* Content */}
            <div className="min-w-0 max-w-135 lg:max-w-none">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-accent/10 text-accent border border-accent/20 text-[11px] font-bold uppercase tracking-wider mb-4">
                {t("badge")}
              </div>

              <h1 className="mb-6 text-balance text-[clamp(2.75rem,5vw,4.5rem)] font-extrabold leading-[1.1] tracking-tight bg-linear-to-br from-white to-muted-foreground bg-clip-text text-transparent">
                {t("title")}
                <br />
                <HighlightedText from="left" delay={0}>
                  {t("title-accent")}
                </HighlightedText>
              </h1>

              <p className="mb-8 max-w-2xl text-balance text-lg text-muted-foreground">
                {t("description")}
              </p>

              <div className="flex flex-wrap gap-3 mt-6">
                <Link href="/library" className={buttonVariants({ variant: "primary", size: "md" })}>
                  {t("cta")}
                  <IconArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Visual */}
            <div className="hidden min-w-0 lg:block">
        <ExtensionPreview />
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

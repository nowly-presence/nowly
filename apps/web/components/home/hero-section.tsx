import { ExtensionStoreButton } from "@/components/extension-store-button";
import { HeroCards } from "@/components/home/hero-cards";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export const HeroSection = async () => {
  const t = await getTranslations("hero");

  return (
    <section className="overflow-x-clip px-5 pb-24 pt-28 sm:px-10 sm:pb-28 sm:pt-36 lg:pb-32 lg:pt-40">
      <div className="mx-auto grid w-full max-w-[1280px] items-center gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-6">
        <div className="max-w-[34rem]">
          <h1 className="text-pretty text-[2.35rem] font-medium leading-[1.06] tracking-tight text-foreground sm:text-[2.85rem] lg:text-[3.35rem]">
            {t("title-before")}{" "}
            <span className="font-bold text-accent">{t("title-accent")}</span>
          </h1>
          <p className="mt-6 max-w-[38ch] text-[1.05rem] leading-[1.55] text-foreground/68 sm:text-lg">
            {t("description")}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <ExtensionStoreButton variant="inverted" size="lg">
              {t("install")}
            </ExtensionStoreButton>
            <Link
              href="/library"
              className="text-sm text-muted-foreground underline decoration-foreground/20 underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground/50"
            >
              {t("library")}
            </Link>
          </div>
        </div>

        <HeroCards />
      </div>
    </section>
  );
};

import Image from "next/image";
import { getTranslations } from "next-intl/server";

export const CustomActivitySection = async () => {
  const t = await getTranslations("custom-activity-section");

  return (
    <section id="custom-activity" className="home-section-deferred scroll-mt-32 overflow-hidden px-5 sm:scroll-mt-40 sm:px-10">
      <div className="mx-auto grid max-w-[1200px] items-center gap-10 pt-20 sm:gap-12 sm:pt-24 lg:min-h-[460px] lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:pt-0">
        <div className="lg:py-24">
          <p className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent">{t("eyebrow")}</p>
          <h2 className="text-pretty text-[26px] font-normal leading-tight sm:text-[2.15rem]">{t("title")}</h2>
          <p className="mt-3 max-w-[48ch] text-base leading-relaxed text-muted-foreground sm:text-lg">{t("description")}</p>
        </div>
        <div className="relative mx-auto aspect-[826/749] w-full max-w-[460px] self-end lg:mt-20 lg:aspect-auto lg:h-[380px] lg:max-w-none">
          <Image
            src="https://cdn.nowly.me/assets/custom-activity/custom-activity-cropped.png"
            alt=""
            fill
            sizes="(min-width: 1280px) 520px, (min-width: 1024px) 44vw, (min-width: 640px) 460px, calc(100vw - 40px)"
            className="object-cover object-top"
          />
        </div>
      </div>
    </section>
  );
};
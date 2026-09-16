import { CtaSection } from "@/components/home/cta-section";
import { FaqSection } from "@/components/home/faq-section";
import { FeaturesSection } from "@/components/home/features-section";
import { HeroSection } from "@/components/home/hero-section";
import { HomeJsonLd } from "@/components/home/home-json-ld";
import { PlatformsSection } from "@/components/home/platforms-section";
import { PrivacySection } from "@/components/home/privacy-section";
import { StepsSection } from "@/components/home/steps-section";
import { getHeroMedia } from "@/lib/media";
import { createMetadata } from "@/lib/seo";
import type { LocaleString } from "@nowly/locales";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("metadata");
  return createMetadata({
    title: t("title"),
    description: t("description"),
    keywords: t.raw("keywords") as string[],
    path: "/",
  });
};

const HomePage = async () => {
  const locale = (await getLocale()) as LocaleString;
  const cards = getHeroMedia(locale);

  return (
    <>
      <HomeJsonLd />
      <HeroSection cards={cards} />
      <PlatformsSection />
      <FeaturesSection />
      <StepsSection />
      <PrivacySection />
      <FaqSection />
      <CtaSection />
    </>
  );
};

export default HomePage;

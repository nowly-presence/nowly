import { CtaSection } from "@/components/home/cta-section";
import { FaqSection } from "@/components/home/faq-section";
import { FeaturesSection } from "@/components/home/features-section";
import { HeroSection } from "@/components/home/hero-section";
import { HomeJsonLd } from "@/components/home/home-json-ld";
import { OpenSourceSection } from "@/components/home/open-source-section";
import { PlatformsSection } from "@/components/home/platforms-section";
import { PrivacySection } from "@/components/home/privacy-section";
import { StepsSection } from "@/components/home/steps-section";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("metadata")]);
  return createMetadata({
    title: t("title"),
    description: t("description"),
    keywords: t.raw("keywords") as string[],
    locale,
    path: "/",
  });
};

const HomePage = async () => {
  return (
    <>
      <HomeJsonLd />
      <HeroSection />
      <PlatformsSection />
      <FeaturesSection />
      <StepsSection />
      <PrivacySection />
      <FaqSection />
      <OpenSourceSection />
      <CtaSection />
    </>
  );
};

export default HomePage;

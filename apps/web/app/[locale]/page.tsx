import { CtaSection } from "@/features/home/components/cta-section";
import { FaqSection } from "@/features/home/components/faq-section";
import { FeaturesSection } from "@/features/home/components/features-section";
import { HeroSection } from "@/features/home/components/hero-section";
import { HomeJsonLd } from "@/features/home/components/home-json-ld";
import { OpenSourceSection } from "@/features/home/components/open-source-section";
import { PlatformsSection } from "@/features/home/components/platforms-section";
import { PrivacySection } from "@/features/home/components/privacy-section";
import { StepsSection } from "@/features/home/components/steps-section";
import { createMetadata } from "@/features/seo/lib/seo";
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

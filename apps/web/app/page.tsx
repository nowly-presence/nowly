import { CtaSection } from "@/components/home/cta-section";
import { FaqSection } from "@/components/home/faq-section";
import { FeaturesSection } from "@/components/home/features-section";
import { HeroSection } from "@/components/home/hero-section";
import { HomeJsonLd } from "@/components/home/home-json-ld";
import { PlatformsSection } from "@/components/home/platforms-section";
import { PrivacySection } from "@/components/home/privacy-section";
import { StepsSection } from "@/components/home/steps-section";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

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
  return (
    <>
      <HomeJsonLd />
      <HeroSection />
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

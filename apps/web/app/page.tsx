import { AdSection } from "@/components/home/ad-section";
import { CtaSection } from "@/components/home/cta-section";
import { FaqSection } from "@/components/home/faq-section";
import { HeroSection } from "@/components/home/hero-section";
import { PresencesSection } from "@/components/home/presences-section";
import { StatsSection } from "@/components/home/stats-section";
import { StepsSection } from "@/components/home/steps-section";
import { HomeStructuredData } from "@/components/seo/home-structured-data";
import { API_BASE_URL } from "@/lib/constants";
import { metadataToPlatform } from "@/lib/data/presence-adapter";
import type { HomeStats } from "@/hooks/use-home-stats";
import type { Metadata as PresenceMetadata } from "@nowly/sdk/metadata";
import { DEFAULT_SEO, createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import type { FC, ReactElement } from "react";

const fetchStats = async (): Promise<HomeStats | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/presences/stats`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json() as Promise<HomeStats>;
  } catch {
    return null;
  }
};

const fetchPresences = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/presences`, { next: { revalidate: 300 } });
    if (!res.ok) return [] as never[];
    const metadata = await res.json() as PresenceMetadata[];
    return metadata.map(metadataToPlatform);
  } catch {
    return [];
  }
};

const generateMetadata = (): Metadata => {
  return createMetadata({
    title: DEFAULT_SEO.title,
    description: DEFAULT_SEO.description,
    path: "/",
  });
};

const Page: FC = async (): Promise<ReactElement> => {
  const [stats, presences] = await Promise.all([fetchStats(), fetchPresences()]);

  return (
    <main>
      <HomeStructuredData />
      <HeroSection />
      <StatsSection stats={stats} />
      <PresencesSection presences={presences} />
      <AdSection />
      <StepsSection />
      <FaqSection />
      <CtaSection />
    </main>
  );
};

export { generateMetadata };

export default Page;

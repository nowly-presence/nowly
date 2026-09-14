import { MarketplaceClient } from "@/components/library/marketplace-client";
import { LibraryStructuredData } from "@/components/seo/library-structured-data";
import { createMetadata } from "@/lib/seo";
import { clientEnv } from "@nowly/env/client";
import type { Metadata } from "next";
import type { FC, ReactElement } from "react";
import { Suspense } from "react";

type PresenceMetadataItem = {
  name?: string
};

const fetchPresenceKeywords = async (): Promise<string[]> => {
  try {
    const res = await fetch(`${clientEnv.NEXT_PUBLIC_API_BASE_URL}/presences`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const presences = await res.json() as PresenceMetadataItem[];

    return presences.flatMap((presence) => {
      const name = presence.name?.trim();
      if (!name) return [];

      return [
        `${name} Discord Rich Presence`,
        `${name} presence`,
        `${name} Discord status`,
      ];
    });
  } catch {
    return [];
  }
};

const generateMetadata = async (): Promise<Metadata> => {
  const presenceKeywords = await fetchPresenceKeywords();

  return createMetadata({
    title: "Discord Rich Presence Library",
    description: "Browse and install Discord Rich Presence integrations for YouTube, Twitch, Disney+, Apple TV+, Prime Video and more.",
    path: "/library",
    keywords: [
      "Discord Rich Presence library",
      "presence library",
      "Discord status integrations",
      ...presenceKeywords
    ],
  });
};

const Page: FC = (): ReactElement => {
  return (
    <>
      <LibraryStructuredData />
      <Suspense>
        <MarketplaceClient />
      </Suspense>
    </>
  );
};

export { generateMetadata };

export default Page;
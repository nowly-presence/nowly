import type { Presence } from "@/lib/data/presences";
import { SITE_URL } from "@/lib/seo";
import { buildPresenceSeoPath } from "@/lib/seo-presence";
import type { FC, ReactElement } from "react";
import { JsonLd } from "./json-ld";

type Props = {
  presence: Presence
  slug: string
};

export const PresenceStructuredData: FC<Props> = ({ presence, slug }): ReactElement => (
  <>
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: `${presence.name} Presence for Nowly`,
        applicationCategory: "BrowserApplication",
        operatingSystem: "Windows, Chromium",
        url: `${SITE_URL}${buildPresenceSeoPath(slug)}`,
        description: presence.description,
        author: {
          "@type": "Person",
          name: presence.author.name,
          url: presence.author.github ? `https://github.com/${presence.author.github}` : undefined,
        },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      }}
    />
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Library",
            item: `${SITE_URL}/library`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: presence.name,
            item: `${SITE_URL}${buildPresenceSeoPath(slug)}`,
          },
        ],
      }}
    />
  </>
);
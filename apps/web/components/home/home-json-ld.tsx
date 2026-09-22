import { JsonLd } from "@/components/seo/json-ld";
import {
  PROJECT_EXTENSION_DOWNLOAD_URL,
} from "@/lib/constants";
import { BRAND_LOCKUP_BLUE } from "@/lib/brand";
import { CANONICAL_ORIGIN, organizationJsonLd, SITE_NAME } from "@/lib/seo";
import { getTranslations } from "next-intl/server";

export const HomeJsonLd = async () => {
  const meta = await getTranslations("metadata");
  const organization = organizationJsonLd();

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          organization,
          {
            "@type": "WebSite",
            "@id": `${CANONICAL_ORIGIN}/#website`,
            name: SITE_NAME,
            url: CANONICAL_ORIGIN,
            description: meta("description"),
            publisher: { "@id": `${CANONICAL_ORIGIN}/#organization` },
          },
          {
            "@type": "SoftwareApplication",
            name: SITE_NAME,
            url: CANONICAL_ORIGIN,
            applicationCategory: "BrowserApplication",
            operatingSystem: "Chrome, Firefox",
            description: meta("description"),
            image: BRAND_LOCKUP_BLUE,
            downloadUrl: PROJECT_EXTENSION_DOWNLOAD_URL,
            installUrl: PROJECT_EXTENSION_DOWNLOAD_URL,
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            publisher: { "@id": `${CANONICAL_ORIGIN}/#organization` },
          },
        ],
      }}
    />
  );
};

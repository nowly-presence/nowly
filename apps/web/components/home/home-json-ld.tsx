import { jsonLd, SITE_NAME, SITE_URL } from "@/lib/seo";
import { getTranslations } from "next-intl/server";

export const HomeJsonLd = async () => {
  const [meta, faq] = await Promise.all([getTranslations("metadata"), getTranslations("faq")]);
  const items = faq.raw("items") as Array<{ question: string; answer: string }>;

  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: "BrowserApplication",
    operatingSystem: "Chrome, Firefox",
    description: meta("description"),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(software) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqPage) }} />
    </>
  );
};

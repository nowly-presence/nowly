import { JsonLd } from "@/features/seo/components/json-ld";
import { CANONICAL_ORIGIN, organizationJsonLd, seoUrl, SITE_NAME } from "@/features/seo/lib/seo";

type Crumb = {
  name: string
  path: string
};

export const WebPageJsonLd = ({
  name,
  description,
  path,
  crumbs,
}: {
  name: string
  description: string
  path: string
  crumbs?: Crumb[]
}) => {
  const url = seoUrl(path);
  const graph: Record<string, unknown>[] = [
    organizationJsonLd(),
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name,
      description,
      isPartOf: {
        "@type": "WebSite",
        name: SITE_NAME,
        url: CANONICAL_ORIGIN,
      },
    },
  ];

  if (crumbs && crumbs.length > 0) {
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: seoUrl(crumb.path),
      })),
    });
  }

  return <JsonLd data={{ "@context": "https://schema.org", "@graph": graph }} />;
};

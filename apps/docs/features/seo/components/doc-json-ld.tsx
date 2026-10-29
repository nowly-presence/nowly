import { getPathname } from "@/i18n/navigation";
import { absoluteUrl } from "@/features/seo/lib/seo";

export const DocJsonLd = ({ title, description, path, locale, category }: {
  title: string;
  description: string;
  path: string;
  locale: string;
  category: string;
}) => {
  if (path.startsWith("/changelog")) return null;

  const url = absoluteUrl(
    getPathname({
      locale,
      href: path
    })
  );
  const breadcrumbs = {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Nowly Docs",
        item: absoluteUrl(
          getPathname({
            locale,
            href: "/"
          })
        )
      },
      {
        "@type": "ListItem",
        position: 2,
        name: title,
        item: url
      }
    ]
  };
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${url}#article`,
        headline: title,
        description,
        url,
        mainEntityOfPage: url,
        inLanguage: locale,
        articleSection: category,
        publisher: {
          "@type": "Organization",
          name: "Nowly",
          url: "https://nowly.me"
        }
      },
      breadcrumbs
    ]
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
};
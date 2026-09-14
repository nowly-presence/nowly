import { SITE_URL } from "@/lib/constants";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactElement } from "react";

const linkClass = "hover:text-foreground transition-colors";

export const FooterLinks: FC = (): ReactElement => {
  const t = useTranslations("footer");

  const categories = [
    {
      label: t("category-product"),
      links: [
        { href: `${SITE_URL}/library`, label: t("marketplace") },
        { href: `${SITE_URL}/host`, label: t("host") },
      ],
    },
    {
      label: t("category-developers"),
      links: [
        { href: "/", label: t("docs") },
        { href: "/changelog", label: t("changelog") },
      ],
    },
    {
      label: t("category-legal"),
      links: [
        { href: `${SITE_URL}/privacy`, label: t("privacy") },
        { href: `${SITE_URL}/tos`, label: t("tos") },
        { href: `${SITE_URL}/legal-notice`, label: t("legal-notice") },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-8 md:grid-cols-3">
      {categories.map((category) => (
        <div key={category.label} className="flex flex-col gap-3">
          <p className="text-xs font-semibold tracking-wider text-foreground/40 uppercase">
            {category.label}
          </p>
          <div className="flex flex-col gap-2">
            {category.links.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

import { docsHref } from "@/lib/seo";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactElement } from "react";

const linkClass = "hover:text-foreground transition-colors";

type FooterCategory = {
  label: string;
  links: { href: string; label: string }[];
};

export const FooterLinks: FC = (): ReactElement => {
  const t = useTranslations("footer");

  const categories: FooterCategory[] = [
    {
      label: t("category-product"),
      links: [
        { href: "/library", label: t("marketplace") },
        { href: "/host", label: t("host") },
        { href: "/support", label: t("help") },
        { href: "/status", label: t("status") },
      ],
    },
    {
      label: t("category-company"),
      links: [
        { href: "/about", label: t("about") },
        { href: "/team", label: t("team") },
        { href: "/faq", label: t("faq") },
      ],
    },
    {
      label: t("category-developers"),
      links: [
        { href: docsHref("/"), label: t("docs") },
        { href: docsHref("/changelog"), label: t("changelog") },
      ],
    },
    {
      label: t("category-legal"),
      links: [
        { href: "/privacy", label: t("privacy") },
        { href: "/tos", label: t("tos") },
        { href: "/legal-notice", label: t("legal-notice") },
        { href: "/consent", label: t("data-management") },
        { href: "/cookies", label: t("cookies") },
      ],
    },
  ];

  return (
    <div className="grid w-fit grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-4">
      {categories.map((category) => (
        <div key={category.label} className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/40">
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

import { FALLBACK_LOCALE, LOCALE_SHORT_MAP, getValidLocale, type LocaleString } from "@nowly/locales";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Separator } from "./separator";

const WEB_ORIGIN = "https://nowly.me";
const DOCS_ORIGIN = (process.env.NEXT_PUBLIC_DOCS_BASE_URL || "https://docs.nowly.me").replace(/\/$/, "");
const DISCORD_INVITE_URL = "https://discord.gg/MnZap7czgB";
const DISCORD_SITE_URL = "https://discord.com";
const PROJECT_REPOSITORY_URL = "https://github.com/nowly-presence/nowly";
const TWITTER_URL = "https://x.com/nowlyme";
const BLUESKY_URL = "https://bsky.app/profile/nowlyme.bsky.social";
const TIKTOK_URL = "https://www.tiktok.com/@nowlyme";

// Same prefix scheme as each app's own i18n/routing.ts (short codes, default locale unprefixed) -
// duplicated here (not imported) because this is the one piece both apps' routers must agree on
// without this shared component depending on either app's routing config.
const localizedUrl = (origin: string, locale: LocaleString, path: string): string => {
  const prefix = locale === FALLBACK_LOCALE ? "" : `/${LOCALE_SHORT_MAP[locale]}`;
  return `${origin}${prefix}${path}`;
};

export type FooterProps = {
  brand: ReactNode;
  actions?: ReactNode;
};

type Link = {
  href: string;
  label: string;
  external?: boolean;
};

const FooterAnchor = ({ link, className }: { link: Link; className: string }) => (
  <a href={link.href} className={className} {...(link.external ? { rel: "noreferrer", target: "_blank" } : {})}>
    {link.label}
  </a>
);

export const Footer = async ({ brand, actions }: FooterProps) => {
  const [requestedLocale, t] = await Promise.all([
    getLocale(),
    getTranslations("footer")
  ]);

  const locale = getValidLocale(requestedLocale);
  const labels = {
    product: t("product"),
    home: t("home"),
    library: t("library"),
    host: t("host"),
    resources: t("resources"),
    docs: t("docs"),
    guides: t("guides"),
    changelog: t("changelog"),
    canary: t("canary"),
    faq: t("faq"),
    support: t("support"),
    status: t("status"),
    branding: t("branding"),
    community: t("community"),
    discord: t("discord"),
    company: t("company"),
    about: t("about"),
    contact: t("contact"),
    github: t("github"),
    twitter: t("twitter"),
    bluesky: t("bluesky"),
    tiktok: "TikTok",
    legalNotice: t("legal-notice"),
    cookies: t("cookies"),
    privacy: t("privacy"),
    consent: t("consent"),
    tos: t("tos"),
    tagline: t("tagline"),
    copyright: t("copyright"),
    trademark: t.rich("trademark", {
      inc: (chunks) => (
        <a
          href={DISCORD_SITE_URL}
          rel="noreferrer"
          target="_blank"
          className="underline decoration-foreground/15 underline-offset-4 transition-colors hover:text-muted-foreground"
        >
          {chunks}
        </a>
      )
    })
  };
  const web = (path: string) => localizedUrl(WEB_ORIGIN, locale, path);
  const docs = () => localizedUrl(DOCS_ORIGIN, locale, "/");

  const columns: {
    title: string;
    links: Link[];
  }[] = [
    {
      title: labels.product,
      links: [
        {
          href: web("/"),
          label: labels.home
        },
        {
          href: web("/library"),
          label: labels.library
        },
        {
          href: web("/desktop"),
          label: labels.host
        }
      ]
    },
    {
      title: labels.resources,
      links: [
        {
          href: docs(),
          label: labels.docs
        },
        {
          href: web("/guides"),
          label: labels.guides
        },
        {
          href: web("/changelog"),
          label: labels.changelog
        },
        {
          href: web("/support"),
          label: labels.support
        },
        {
          href: web("/faq"),
          label: labels.faq
        },
        {
          href: web("/status"),
          label: labels.status
        },
        {
          href: web("/branding"),
          label: labels.branding
        }
      ]
    },
    {
      title: labels.community,
      links: [
        {
          href: DISCORD_INVITE_URL,
          label: labels.discord,
          external: true
        },
        {
          href: PROJECT_REPOSITORY_URL,
          label: labels.github,
          external: true
        },
        {
          href: TWITTER_URL,
          label: labels.twitter,
          external: true
        },
        {
          href: BLUESKY_URL,
          label: labels.bluesky,
          external: true
        },
        {
          href: TIKTOK_URL,
          label: labels.tiktok,
          external: true
        }
      ]
    },
    {
      title: labels.company,
      links: [
        {
          href: web("/about"),
          label: labels.about
        },
        {
          href: web("/support#contact"),
          label: labels.contact
        }
      ]
    }
  ];

  const legalLinks: Link[] = [
    {
      href: web("/legal-notice"),
      label: labels.legalNotice
    },
    {
      href: web("/cookies"),
      label: labels.cookies
    },
    {
      href: web("/privacy"),
      label: labels.privacy
    },
    {
      href: web("/consent"),
      label: labels.consent
    },
    {
      href: web("/tos"),
      label: labels.tos
    }
  ];

  return (
    <footer className="relative overflow-hidden px-5 pt-10 pb-8 sm:px-8 lg:px-9">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-10 lg:flex-row lg:justify-between">
        <div className="max-w-xs">
          {brand}
          <p className="mt-3 text-base text-muted-foreground">{labels.tagline}</p>
          {actions ? <div className="mt-5 flex items-center gap-2">{actions}</div> : null}
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:gap-16">
          {columns.map((column) => (
            <div key={column.title} className="text-sm leading-relaxed text-muted-foreground">
              <p className="font-bold">{column.title}</p>
              <ul className="mt-2 flex flex-col gap-1">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <FooterAnchor link={link} className="transition-opacity hover:opacity-80" />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <Separator className="mx-auto mt-16 max-w-[1280px]" />
      <div className="mx-auto mt-5 flex max-w-[1280px] flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p>{labels.copyright}</p>
          <p className="text-muted-foreground/70">{labels.trademark}</p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 sm:justify-end">
          {legalLinks.map((link) => (
            <FooterAnchor key={link.href} link={link} className="hover:opacity-80" />
          ))}
        </nav>
      </div>
    </footer>
  );
};

export { DISCORD_SITE_URL as FOOTER_DISCORD_SITE_URL };
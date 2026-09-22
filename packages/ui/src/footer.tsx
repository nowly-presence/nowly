import { FALLBACK_LOCALE, LOCALE_SHORT_MAP, type LocaleString } from "@nowly/locales";
import { Separator } from "./separator";
import type { ReactNode } from "react";

const WEB_ORIGIN = "https://nowly.me";
const DOCS_ORIGIN = "https://docs.nowly.me";
const DISCORD_INVITE_URL = "https://discord.gg/MnZap7czgB";
const DISCORD_SITE_URL = "https://discord.com";
const PROJECT_REPOSITORY_URL = "https://github.com/nowly-presence/nowly";
const TWITTER_URL = "https://x.com/nowlyme";

// Same prefix scheme as each app's own i18n/routing.ts (short codes, default locale unprefixed) -
// duplicated here (not imported) because this is the one piece both apps' routers must agree on
// without this shared component depending on either app's routing config.
const localizedUrl = (origin: string, locale: LocaleString, path: string): string => {
  const prefix = locale === FALLBACK_LOCALE ? "" : `/${LOCALE_SHORT_MAP[locale]}`;
  return `${origin}${prefix}${path}`;
};

export type FooterLabels = {
  product: string
  home: string
  library: string
  host: string
  resources: string
  docs: string
  changelog: string
  canary: string
  support: string
  status: string
  branding: string
  community: string
  discord: string
  github: string
  twitter: string
  legalNotice: string
  cookies: string
  privacy: string
  consent: string
  tos: string
  tagline: string
  copyright: string
  trademark: ReactNode
};

export type FooterProps = {
  locale: LocaleString
  brand: ReactNode
  actions?: ReactNode
  labels: FooterLabels
};

type Link = { href: string; label: string; external?: boolean };

const FooterAnchor = ({ link, className }: { link: Link; className: string }) => (
  <a href={link.href} className={className} {...(link.external ? { rel: "noreferrer", target: "_blank" } : {})}>
    {link.label}
  </a>
);

export const Footer = ({ locale, brand, actions, labels }: FooterProps) => {
  const web = (path: string) => localizedUrl(WEB_ORIGIN, locale, path);
  const docs = () => localizedUrl(DOCS_ORIGIN, locale, "/");

  const columns: { title: string; links: Link[] }[] = [
    {
      title: labels.product,
      links: [
        { href: web("/"), label: labels.home },
        { href: web("/library"), label: labels.library },
        { href: web("/desktop"), label: labels.host },
      ],
    },
    {
      title: labels.resources,
      links: [
        { href: docs(), label: labels.docs },
        { href: web("/changelog"), label: labels.changelog },
        { href: web("/canary"), label: labels.canary },
        { href: web("/support"), label: labels.support },
        { href: web("/status"), label: labels.status },
        { href: web("/branding"), label: labels.branding },
      ],
    },
    {
      title: labels.community,
      links: [
        { href: DISCORD_INVITE_URL, label: labels.discord, external: true },
        { href: PROJECT_REPOSITORY_URL, label: labels.github, external: true },
        { href: TWITTER_URL, label: labels.twitter, external: true },
      ],
    },
  ];

  const legalLinks: Link[] = [
    { href: web("/legal-notice"), label: labels.legalNotice },
    { href: web("/cookies"), label: labels.cookies },
    { href: web("/privacy"), label: labels.privacy },
    { href: web("/consent"), label: labels.consent },
    { href: web("/tos"), label: labels.tos },
  ];

  return (
    <footer className="relative overflow-hidden px-5 pt-10 pb-8 sm:px-8 lg:px-9">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-10 lg:flex-row lg:justify-between">
        <div className="max-w-xs">
          {brand}
          <p className="mt-3 text-base text-muted-foreground">{labels.tagline}</p>
          {actions ? <div className="mt-5 flex items-center gap-2">{actions}</div> : null}
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:gap-16">
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
          <p className="text-muted-foreground/55">{labels.trademark}</p>
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

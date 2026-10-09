import { docsHref } from "@/features/seo/lib/seo";
import { ContactForm } from "@/features/support/components/contact-form";
import { DonateCard } from "@/features/support/components/donate-card";
import { SUPPORT_LINKS } from "@/features/support/lib/support-links";
import { Link } from "@/i18n/navigation";
import { DISCORD_INVITE_URL } from "@/lib/constants";
import {
  RiAddLine,
  RiAlertLine,
  RiArrowRightUpLine,
  RiBookOpenLine,
  RiBugLine,
  RiDiscordFill,
  RiGithubLine,
  RiLightbulbLine,
} from "@nowly/ui/icons";
import { getMessages, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

type SupportLink = {
  key: "discord" | "docs" | "broken" | "request" | "bug" | "feature" | "other"
  href: string
  icon: typeof RiDiscordFill
};

const sections: Array<{ id: "community" | "presences" | "technical"; links: SupportLink[] }> = [
  {
    id: "community",
    links: [
      { key: "discord", href: DISCORD_INVITE_URL, icon: RiDiscordFill },
      { key: "docs", href: docsHref("/getting-started/troubleshooting"), icon: RiBookOpenLine },
    ],
  },
  {
    id: "presences",
    links: [
      { key: "broken", href: SUPPORT_LINKS.brokenPresence, icon: RiAlertLine },
      { key: "request", href: SUPPORT_LINKS.newPresence, icon: RiAddLine },
    ],
  },
  {
    id: "technical",
    links: [
      { key: "bug", href: SUPPORT_LINKS.bugReport, icon: RiBugLine },
      { key: "feature", href: SUPPORT_LINKS.featureRequest, icon: RiLightbulbLine },
      { key: "other", href: SUPPORT_LINKS.blankIssue, icon: RiGithubLine },
    ],
  },
];

const INLINE_LINK = "underline underline-offset-4 transition-colors hover:text-foreground";

export const SupportView = async () => {
  const [t, messages] = await Promise.all([getTranslations("supportPage"), getMessages()]);
  const email = (messages.legal as { "publisher-email": string })["publisher-email"];
  const internalLink = (href: string) => (chunks: ReactNode) => (
    <Link href={href} className={INLINE_LINK}>
      {chunks}
    </Link>
  );

  return (
    <div className="pb-24 pt-16 sm:pb-32 sm:pt-24">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-10">
        <header className="max-w-2xl">
          <p className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent">
            {t("eyebrow")}
          </p>
          <h1 className="text-pretty text-[2.2rem] font-medium leading-[1.08] tracking-tight text-foreground sm:text-[2.75rem]">
            {t("title")}
          </h1>
          <p className="mt-4 text-[1.05rem] leading-relaxed text-foreground/68">
            {t("description")}
          </p>
        </header>

        <div className="mt-14 grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.75fr)] lg:gap-16">
          <div className="space-y-10">
            {sections.map((section) => (
              <section key={section.id}>
                <h2 className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {t(`sections.${section.id}`)}
                </h2>
                <ul className="mt-4 divide-y divide-border overflow-hidden rounded-[16px] border border-border">
                  {section.links.map((link) => {
                    const Icon = link.icon;
                    return (
                      <li key={link.key}>
                        <a
                          href={link.href}
                          rel="noreferrer"
                          target="_blank"
                          className="group flex items-start gap-4 px-5 py-4 -outline-offset-2 transition-colors hover:bg-foreground/4"
                        >
                          <Icon className="mt-0.5 size-5 shrink-0 text-accent" />
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium text-foreground">{t(`${link.key}.title`)}</span>
                            <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                              {t(`${link.key}.description`)}
                            </span>
                          </span>
                          <RiArrowRightUpLine className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>

          <div id="contact" className="scroll-mt-32 lg:sticky lg:top-32">
            <ContactForm />
            <div className="mt-5 space-y-2 px-1 text-sm leading-relaxed text-muted-foreground">
              <p>
                {t.rich("email", {
                  email,
                  link: (chunks) => (
                    <a href={`mailto:${email}`} className={INLINE_LINK}>
                      {chunks}
                    </a>
                  ),
                })}
              </p>
              <p>{t.rich("privacy", { link: internalLink("/consent") })}</p>
            </div>
          </div>
        </div>

        <DonateCard />

        <p className="mt-10 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t.rich("publisher", { link: internalLink("/legal-notice") })}
        </p>
      </div>
    </div>
  );
};

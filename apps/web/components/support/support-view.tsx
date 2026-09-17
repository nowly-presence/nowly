import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { DISCORD_INVITE_URL } from "@/lib/constants";
import { docsHref } from "@/lib/seo";
import { SUPPORT_LINKS } from "@/lib/support-links";
import {
  RiAddLine,
  RiAlertLine,
  RiBookOpenLine,
  RiBugLine,
  RiDiscordFill,
  RiLightbulbLine,
  RiMoreLine,
} from "@remixicon/react";
import { getTranslations } from "next-intl/server";

type SupportCard = {
  key: "discord" | "docs" | "broken" | "request" | "bug" | "feature" | "other"
  href: string
  icon: typeof RiDiscordFill
};

const sections: Array<{ id: "community" | "presences" | "technical"; cards: SupportCard[] }> = [
  {
    id: "community",
    cards: [
      { key: "discord", href: DISCORD_INVITE_URL, icon: RiDiscordFill },
      { key: "docs", href: docsHref("/getting-started/troubleshooting"), icon: RiBookOpenLine },
    ],
  },
  {
    id: "presences",
    cards: [
      { key: "broken", href: SUPPORT_LINKS.brokenPresence, icon: RiAlertLine },
      { key: "request", href: SUPPORT_LINKS.newPresence, icon: RiAddLine },
    ],
  },
  {
    id: "technical",
    cards: [
      { key: "bug", href: SUPPORT_LINKS.bugReport, icon: RiBugLine },
      { key: "feature", href: SUPPORT_LINKS.featureRequest, icon: RiLightbulbLine },
      { key: "other", href: SUPPORT_LINKS.blankIssue, icon: RiMoreLine },
    ],
  },
];

export const SupportView = async () => {
  const t = await getTranslations("supportPage");

  return (
    <div className="pb-24 pt-16 sm:pb-32 sm:pt-24">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-10">
        <header className="max-w-xl">
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

        <div className="mt-14 space-y-12">
          {sections.map((section) => (
            <section key={section.id}>
              <h2 className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {t(`sections.${section.id}`)}
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {section.cards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <a
                      key={card.key}
                      href={card.href}
                      rel="noreferrer"
                      target="_blank"
                      className="block rounded-[16px] outline-offset-4"
                    >
                      <Card className="h-full transition-colors hover:bg-foreground/6">
                        <CardContent>
                          <Icon className="size-5 text-accent" />
                          <CardTitle className="mt-4 text-lg">{t(`${card.key}.title`)}</CardTitle>
                          <CardDescription className="mt-2">
                            {t(`${card.key}.description`)}
                          </CardDescription>
                          <p className="mt-5 text-sm font-medium text-accent">{t("open")}</p>
                        </CardContent>
                      </Card>
                    </a>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-16 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {t.rich("donate", {
            kofi: (chunks) => (
              <a
                href={SUPPORT_LINKS.kofi}
                rel="noreferrer"
                target="_blank"
                className="whitespace-nowrap underline underline-offset-4 hover:text-foreground"
              >
                {chunks}
              </a>
            ),
            sponsors: (chunks) => (
              <a
                href={SUPPORT_LINKS.sponsors}
                rel="noreferrer"
                target="_blank"
                className="whitespace-nowrap underline underline-offset-4 hover:text-foreground"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      </div>
    </div>
  );
};

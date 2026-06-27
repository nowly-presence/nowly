import { DiscordIcon } from "@/components/icons";
import { SupportCard, type SupportCardProps } from "@/components/support/support-card";
import { SupportHero } from "@/components/support/support-hero";
import {
  DISCORD_INVITE_URL, PROJECT_BROKEN_PRESENCE_URL, PROJECT_BUG_REPORT_URL,
  PROJECT_FEATURE_REQUEST_URL, PROJECT_ISSUES_URL, PROJECT_NEW_PRESENCE_URL
} from "@/lib/constants";
import { createMetadata } from "@/lib/seo";
import { IconBug, IconBulb, IconMessage, IconCirclePlus, IconTool } from "@tabler/icons-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactElement, SVGProps } from "react";

const DiscordSupportIcon = ({ className, ...props }: SVGProps<SVGSVGElement>): ReactElement => (
  <DiscordIcon className={className} fill="currentColor" {...props} />
);

const generateMetadata = (): Metadata => {
  return createMetadata({
    title: "Nowly Support",
    description: "Get help with Nowly, report a broken presence, request a platform, or suggest an improvement.",
    path: "/support",
  });
};

type Section = {
  label: string
  cards: SupportCardProps[]
};

const Page = async (): Promise<ReactElement> => {
  const t = await getTranslations("support-page");

  const sections: Section[] = [
    {
      label: t("sectionPresences"),
      cards: [
        {
          title: t("brokenPresence.title"),
          description: t("brokenPresence.description"),
          href: PROJECT_BROKEN_PRESENCE_URL,
          icon: IconTool,
        },
        {
          title: t("newPresence.title"),
          description: t("newPresence.description"),
          href: PROJECT_NEW_PRESENCE_URL,
          icon: IconCirclePlus,
        },
      ],
    },
    {
      label: t("sectionTechnical"),
      cards: [
        {
          title: t("bugReport.title"),
          description: t("bugReport.description"),
          href: PROJECT_BUG_REPORT_URL,
          icon: IconBug,
        },
        {
          title: t("featureRequest.title"),
          description: t("featureRequest.description"),
          href: PROJECT_FEATURE_REQUEST_URL,
          icon: IconBulb,
        },
      ],
    },
    {
      label: t("sectionCommunity"),
      cards: [
        {
          title: t("discord.title"),
          description: t("discord.description"),
          href: DISCORD_INVITE_URL,
          icon: DiscordSupportIcon,
          tone: "discord",
        },
        {
          title: t("blankIssue.title"),
          description: t("blankIssue.description"),
          href: `${PROJECT_ISSUES_URL}/new`,
          icon: IconMessage,
        },
      ],
    },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl min-w-0 px-6 py-24">
      <SupportHero
        badge={t("badge")}
        title={t("title")}
        description={t("description")}
      />

      {sections.map((section) => (
        <section key={section.label} className="mb-12 last:mb-0">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {section.label}
          </h2>
          <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
            {section.cards.map((card) => (
              <SupportCard key={card.href} {...card} />
            ))}
          </div>
        </section>
      ))}

    </main>
  );
};

export { generateMetadata };

export default Page;

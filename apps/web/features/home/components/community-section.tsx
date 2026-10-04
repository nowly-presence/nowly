import { DISCORD_INVITE_URL } from "@/lib/constants";
import { getDiscordCommunity } from "@/lib/discord";
import { ButtonAnchor } from "@nowly/ui/button-link";
import { RiArrowRightUpLine, RiCustomerService2Line, RiDiscordFill, RiLightbulbLine, RiTeamLine } from "@remixicon/react";
import { getTranslations } from "next-intl/server";

const icons = [RiCustomerService2Line, RiLightbulbLine, RiTeamLine];

export const CommunitySection = async () => {
  const [t, community] = await Promise.all([getTranslations("community"), getDiscordCommunity()]);
  const items = t.raw("items") as Array<{ title: string; description: string }>;

  return (
    <section id="community" className="home-section-deferred px-5 pb-28 sm:px-10 sm:pb-36">
      <div className="mx-auto grid w-full max-w-[1200px] items-center gap-10 rounded-[24px] bg-section-alt px-6 py-12 shadow-[0_0_0_1px_var(--border)] sm:px-12 sm:py-16 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-16">
        <div>
          <p className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent">{t("eyebrow")}</p>
          <h2 className="text-pretty text-[26px] font-normal leading-tight text-foreground sm:text-[2.15rem]">
            {t("title")}
          </h2>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground sm:text-lg">{t("description")}</p>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <ButtonAnchor href={DISCORD_INVITE_URL} rel="noreferrer" target="_blank" variant="inverted" size="lg">
              <RiDiscordFill data-icon="inline-start" />
              {t("cta")}
              <RiArrowRightUpLine data-icon="inline-end" />
            </ButtonAnchor>
            {community.members || community.online ? (
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {community.members ? <span>{t("members", { count: community.members })}</span> : null}
                {community.online ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden className="size-1.5 rounded-full bg-success" />
                    {t("online", { count: community.online })}
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>
        </div>

        <ul className="divide-y divide-foreground/8">
          {items.map((item, index) => {
            const Icon = icons[index] ?? RiTeamLine;
            return (
              <li key={item.title} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-accent/12 text-accent">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="font-medium leading-snug text-foreground">{item.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

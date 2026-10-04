import { ExtensionStoreButton } from "@/components/extension-store-button";
import { HeroCards } from "@/features/home/components/hero-cards";
import { Link } from "@/i18n/navigation";
import { DISCORD_INVITE_URL } from "@/lib/constants";
import { getDiscordCommunity } from "@/lib/discord";
import { RiArrowRightLine, RiDiscordFill } from "@remixicon/react";
import { getTranslations } from "next-intl/server";

export const HeroSection = async () => {
  const [t, community] = await Promise.all([getTranslations("hero"), getDiscordCommunity()]);

  return (
    <section className="overflow-x-clip px-5 pb-24 pt-28 sm:px-10 sm:pb-28 sm:pt-36 lg:pb-32 lg:pt-40">
      <div className="mx-auto grid w-full max-w-[1280px] items-center gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-6">
        <div className="max-w-[34rem]">
          <a
            href={DISCORD_INVITE_URL}
            rel="noreferrer"
            target="_blank"
            className="group mb-7 inline-flex max-w-full items-center gap-2.5 rounded-full bg-foreground/5 py-1.5 pr-3.5 pl-1.5 text-sm text-foreground/80 transition-colors hover:bg-foreground/9 hover:text-foreground"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent">
              <RiDiscordFill className="size-3.5" />
            </span>
            <span className="truncate">
              {t("discord")}
              {community.members ? (
                <span className="text-muted-foreground">{` · ${t("discord-members", { count: community.members })}`}</span>
              ) : null}
            </span>
            <RiArrowRightLine className="size-3.5 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5" />
          </a>
          <h1 className="text-pretty text-[2.35rem] font-medium leading-[1.06] tracking-tight text-foreground sm:text-[2.85rem] lg:text-[3.35rem]">
            {t("title-before")}{" "}
            <span className="font-bold text-accent">{t("title-accent")}</span>
          </h1>
          <p className="mt-6 max-w-[38ch] text-[1.05rem] leading-[1.55] text-foreground/68 sm:text-lg">
            {t("description")}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <ExtensionStoreButton variant="inverted" size="lg">
              {t("install")}
            </ExtensionStoreButton>
            <Link
              href="/library"
              className="text-sm text-muted-foreground underline decoration-foreground/20 underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground/50"
            >
              {t("library")}
            </Link>
          </div>
        </div>

        <HeroCards />
      </div>
    </section>
  );
};

import { ButtonLink } from "@/components/button-link";
import { DiscordCallout } from "@/components/discord-callout";
import { ExtensionStoreButton } from "@/components/extension-store-button";
import { ContentToc } from "@/features/content/components/content-toc";
import { MarkdownBody } from "@/features/content/components/markdown-body";
import { formatChangelogDate } from "@/features/changelog/lib/format-changelog-date";
import { GuideCard } from "@/features/guides/components/guide-card";
import { getGuides, relatedGuides, type Guide } from "@/features/guides/lib/guides";
import { Alert, AlertDescription } from "@nowly/ui";
import { RiArrowLeftLine, RiTranslate2 } from "@nowly/ui/icons";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

export const GuideView = async ({ guide, beforeRelated }: { guide: Guide; beforeRelated?: ReactNode }) => {
  const [t, locale] = await Promise.all([getTranslations("guidesPage"), getLocale()]);
  const related = relatedGuides(guide, getGuides(locale));

  return (
    <div className="pb-24 pt-16 sm:pb-32 sm:pt-24">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-10">
        <ButtonLink href="/guides" variant="ghost" size="sm">
          <RiArrowLeftLine data-icon="inline-start" />
          {t("back")}
        </ButtonLink>

        <div className="mt-8 grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-16">
          <article className="min-w-0 max-w-3xl">
            <header>
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-accent">
                {t(`categories.${guide.category}`)}
              </p>
              <h1 className="mt-2 text-pretty text-[2.1rem] font-medium leading-[1.1] tracking-tight text-foreground sm:text-[2.6rem]">
                {guide.title}
              </h1>
              <p className="mt-4 text-[1.1rem] leading-relaxed text-foreground/68">{guide.description}</p>
              <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {guide.updated ? <span>{t("updated", { date: formatChangelogDate(guide.updated, locale) })}</span> : null}
                <span>{t("minutes", { count: guide.minutes })}</span>
              </p>
            </header>

            {!guide.entry.translated ? (
              <Alert className="mt-8 rounded-[16px]">
                <RiTranslate2 />
                <AlertDescription>{t("fallback")}</AlertDescription>
              </Alert>
            ) : null}

            <MarkdownBody blocks={guide.entry.blocks} className="mt-10" />

            <div className="mt-14 rounded-[20px] bg-cta-surface px-6 py-8 text-cta-ink sm:px-8">
              <p className="text-xl font-normal">{t("cta.title")}</p>
              <p className="mt-2 text-cta-muted">{t("cta.description")}</p>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                <ExtensionStoreButton variant="dark" />
                <ButtonLink href="/library" variant="ghost" className="text-cta-ink hover:bg-white/10 hover:text-cta-ink">
                  {t("cta.library")}
                </ButtonLink>
              </div>
            </div>

            <DiscordCallout
              className="mt-6"
              layout="row"
              title={t("help.title")}
              description={t("help.description")}
              cta={t("help.cta")}
            />
          </article>

          <ContentToc headings={guide.entry.headings} title={t("toc")} className="sticky top-32 hidden lg:block" />
        </div>

        {beforeRelated}

        {related.length > 0 ? (
          <section className="mt-20" aria-labelledby="guides-related">
            <h2 id="guides-related" className="text-[1.35rem] font-medium tracking-tight text-foreground">{t("related")}</h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.slug}>
                  <GuideCard
                    guide={item}
                    categoryLabel={t(`categories.${item.category}`)}
                    minutesLabel={t("minutes", { count: item.minutes })}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
};

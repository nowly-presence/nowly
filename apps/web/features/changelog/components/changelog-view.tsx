import { ButtonLink } from "@/components/button-link";
import { ButtonAnchor } from "@nowly/ui";


import { ChangelogList } from "@/features/changelog/components/changelog-list";
import {
  formatChangelogDate,
  getChangelogReleases,
  latestReleaseSlugByStore,
  type ChangelogRelease,
} from "@/features/changelog/lib/changelog-releases";
import { docsHref } from "@/features/seo/lib/seo";
import { RiArrowLeftLine } from "@nowly/ui/icons";
import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";

export const ChangelogView = async () => {
  const [t, locale] = await Promise.all([
    getTranslations("changelogPage"),
    getLocale(),
  ]);
  const releases = getChangelogReleases(locale);
  const latestByStore = latestReleaseSlugByStore(releases);

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

        <div className="mt-12 max-w-3xl">
          <ChangelogList releases={releases} latestByStore={latestByStore} locale={locale} />
        </div>

        <div className="mt-10">
          <ButtonAnchor href={docsHref("/changelog")} rel="noreferrer" target="_blank" variant="outline">
            {t("docs")}
          </ButtonAnchor>
        </div>
      </div>
    </div>
  );
};

export const ChangelogReleaseView = async ({
  version,
  release,
}: {
  version: string
  release: ChangelogRelease | null
}) => {
  const [t, locale] = await Promise.all([
    getTranslations("changelogPage"),
    getLocale(),
  ]);
  const notesHref = release
    ? docsHref(`/changelog/${release.slug}`)
    : docsHref("/changelog");

  return (
    <div className="pb-24 pt-16 sm:pb-32 sm:pt-24">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-10">
        <ButtonLink href="/changelog" variant="ghost" size="sm">
          <RiArrowLeftLine data-icon="inline-start" />
          {t("back")}
        </ButtonLink>

        <header className="mt-10 max-w-xl">
          <p className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent">
            {t("update-eyebrow")}
          </p>
          <h1 className="text-pretty text-[2.2rem] font-medium leading-[1.08] tracking-tight text-foreground sm:text-[2.75rem]">
            {t("update-title", { version })}
          </h1>
          <p className="mt-4 text-[1.05rem] leading-relaxed text-foreground/68">
            {release ? t("update-description", { version }) : t("missing")}
          </p>
          {release?.date ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {formatChangelogDate(release.date, locale)}
            </p>
          ) : null}
        </header>

        {release?.banner ? (
          <div className="relative mt-10 aspect-video max-w-3xl overflow-hidden rounded-[16px] bg-foreground/6">
            <Image
              src={release.banner}
              alt={t("banner-alt", { version: release.version })}
              fill
              sizes="(min-width: 768px) 48rem, 100vw"
              className="object-cover object-top"
              priority
            />
          </div>
        ) : null}

        {release ? (
          <p className="mt-8 max-w-2xl text-[1.05rem] leading-relaxed text-foreground/80">
            {release.summary}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-2">
          <ButtonAnchor href={notesHref} rel="noreferrer" target="_blank" variant="inverted">
            {t("docs")}
          </ButtonAnchor>
          <ButtonLink href="/library" variant="outline">
            {t("library")}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
};

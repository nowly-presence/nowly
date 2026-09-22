import { LibraryCard } from "@/features/library/components/library-card";
import { LibraryMedia } from "@/features/library/components/library-media";
import { PresenceActions } from "@/features/library/components/presence-actions";
import { PresenceInfo } from "@/features/library/components/presence-info";
import { ButtonLink } from "@/components/button-link";
import { Alert, AlertDescription, AlertTitle, Card, CardContent, CardTitle } from "@nowly/ui";



import {
  localizedDescription,
  localizedFeatures,
  localizedLongDescription,
  relatedPresences,
  type LibraryPresence,
} from "@/lib/library-catalog";
import type { PresenceStats, PresenceVersionNote } from "@/lib/presence-api";
import { RiArrowLeftLine, RiCheckboxCircleLine, RiInformationLine } from "@nowly/ui/icons";
import { getTranslations } from "next-intl/server";

type PresenceViewProps = {
  presence: LibraryPresence
  catalog: LibraryPresence[]
  locale: string
  versions: PresenceVersionNote[]
  stats: PresenceStats
};

export const PresenceView = async ({ presence, catalog, locale, versions, stats }: PresenceViewProps) => {
  const t = await getTranslations("presencePage");
  const library = await getTranslations("libraryPage");
  const description = localizedDescription(presence, locale);
  const about = localizedLongDescription(presence, locale);
  const features = localizedFeatures(presence, locale);
  const related = relatedPresences(catalog, presence);
  const currentVersion = versions.find((entry) => entry.version === presence.version) ?? versions[0] ?? null;
  const currentNote = currentVersion?.note[locale as keyof typeof currentVersion.note] || currentVersion?.note["en-US"] || "";

  return (
    <div className="pb-24 pt-16 sm:pb-32 sm:pt-24">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-10">
        <ButtonLink href="/library" variant="ghost" size="sm">
          <RiArrowLeftLine data-icon="inline-start" />
          {t("back")}
        </ButtonLink>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.8fr)] lg:gap-8">
          <div className="flex flex-col gap-6">
            <Card className="gap-0 py-0">
              <LibraryMedia slug={presence.slug} name={presence.name} variant="hero" />
              <CardContent className="pt-6 pb-8 sm:pt-8">
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-accent">
                  {library(`categories.${presence.category}`)}
                </p>
                <h1 className="mt-2 text-pretty text-[2.2rem] font-medium leading-[1.08] tracking-tight text-foreground sm:text-[2.75rem]">
                  {presence.name}
                </h1>
                <p className="mt-4 max-w-[46ch] text-[1.05rem] leading-relaxed text-foreground/68">
                  {description}
                </p>
                {presence.discordNative ? (
                  <Alert className="mt-6 rounded-[16px] border-accent/20 bg-accent/8 px-4 py-3.5">
                    <RiInformationLine className="text-accent" />
                    <AlertTitle>{t("discord-native-title")}</AlertTitle>
                    <AlertDescription>
                      {t("discord-native-description", { name: presence.name })}
                    </AlertDescription>
                  </Alert>
                ) : null}
                <PresenceActions
                  slug={presence.slug}
                  name={presence.name}
                  version={presence.version}
                  likeCount={stats.likes}
                />
            {about && about !== description ? (
                  <div className="mt-8 border-t border-foreground/8 pt-8">
                    <CardTitle>{t("about")}</CardTitle>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{about}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <PresenceInfo presence={presence} commit={currentVersion?.commit ?? null} changelog={currentNote} stats={stats} />
            {features.length > 0 ? (
              <Card size="sm">
                <CardContent>
                  <CardTitle>{t("features")}</CardTitle>
                  <ul className="mt-4 flex flex-col gap-3">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                        <RiCheckboxCircleLine className="mt-0.5 size-5 shrink-0 text-accent" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>

        {related.length > 0 ? (
          <section className="mt-20">
            <h2 className="text-[1.35rem] font-medium tracking-tight text-foreground">
              {t("related-title")}
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <LibraryCard key={item.slug} presence={item} locale={locale} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
};

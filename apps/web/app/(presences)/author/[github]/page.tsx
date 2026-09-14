import { PageLayout } from "@/components/layout/page-layout";
import { PresenceCard } from "@/components/library/presence-card";
import { fetchPresences } from "@/lib/data/fetch-presences";
import { contributorDisplayName, normalizeGithub, presenceMatchesGithub } from "@/lib/library-query";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";

type Props = {
  params: Promise<{ github: string }>
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { github } = await params;
  const handle = normalizeGithub(github);
  const presences = await fetchPresences().catch(() => []);
  const authored = presences.filter((presence) => presenceMatchesGithub(presence, handle));
  const name = authored[0] ? contributorDisplayName(authored[0], handle) : handle;

  return createMetadata({
    title: `${name} — Nowly authors`,
    description: `Presences contributed by ${name} on Nowly.`,
    path: `/author/${handle}`,
    noIndex: authored.length === 0,
  });
};

const Page = async ({ params }: Props): Promise<ReactElement> => {
  const { github } = await params;
  const handle = normalizeGithub(github);
  if (!handle) notFound();

  const [presences, locale, t] = await Promise.all([
    fetchPresences().catch(() => []),
    getLocale(),
    getTranslations("author-page"),
  ]);

  const authored = presences.filter((presence) => presenceMatchesGithub(presence, handle));
  if (authored.length === 0) notFound();

  const name = contributorDisplayName(authored[0], handle);

  return (
    <PageLayout>
      <div className="mx-auto max-w-300 px-6">
        <div className="mx-auto mb-12 max-w-150 text-center">
          <span className="mb-4 block text-xs font-bold uppercase tracking-widest text-accent">
            {t("badge")}
          </span>
          <h1 className="mb-4 text-[2.5rem] font-extrabold tracking-tight">{name}</h1>
          <p className="text-muted-foreground">
            {t("description", { name, count: authored.length })}
          </p>
          <p className="mt-4 text-sm">
            <Link href={`/library?author=${handle}`} className="text-accent hover:underline">
              {t("view-in-library")}
            </Link>
            {" · "}
            <a
              href={`https://github.com/${handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              GitHub
            </a>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {authored.map((presence) => (
            <PresenceCard key={presence.id} presence={presence} locale={locale} />
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

export default Page;

"use client";

import { LibraryMedia } from "@/features/library/components/library-media";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardDescription, CardTitle } from "@nowly/ui";

import { localizedDescription, type LibraryPresence } from "@/lib/library-catalog";
import { useTranslations } from "next-intl";

type LibraryCardProps = {
  presence: LibraryPresence
  locale: string
};

export const LibraryCard = ({ presence, locale }: LibraryCardProps) => {
  const t = useTranslations("libraryPage");

  return (
    <Link href={`/library/${presence.slug}`} className="block rounded-[16px] outline-offset-4">
      <Card className="h-full gap-0 py-0 transition-colors hover:bg-foreground/6">
        <LibraryMedia slug={presence.slug} name={presence.name} />
        <CardContent className="pt-4 pb-6">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-accent">
            {t(`categories.${presence.category}`)}
          </p>
          <CardTitle className="mt-1.5">{presence.name}</CardTitle>
          <CardDescription className="mt-2 line-clamp-2">
            {localizedDescription(presence, locale)}
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
};

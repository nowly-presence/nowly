import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@tabler/icons-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactElement } from "react";
import { PresenceItemMore, PresenceLinkItem } from "./presence-link-item";
import type { Presence } from "@/lib/data/presences";

type Props = {
  presences: Presence[]
};

export const PresencesSection: FC<Props> = ({ presences }): ReactElement | null => {
  const t = useTranslations("platforms-section");
  const locale = useLocale();

  const available = presences.filter((p) => p.status === "available");

  if (available.length === 0) return null;

  return (
    <section className="py-24 border-b border-border">
      <div className="max-w-300 mx-auto px-6 relative z-2">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-150">
            <span className="text-accent font-bold uppercase tracking-widest text-xs mb-4 block">
              {t("section-label")}
            </span>

            <h2 className="text-[2.5rem] mb-4">
              {t("title")}
            </h2>

            <p className="text-muted-foreground">
              {t("description")}
            </p>
          </div>

          <Button asChild variant="outline" size="md" className="w-fit">
            <Link href="/library">
              {t("library-cta")}
              <IconArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-12">
          <div className="space-y-5">
            <p className="text-sm text-dim-foreground">
              {t("services-count", { count: available.length })}
            </p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {available.slice(0, 8).map((presence) => (
                <PresenceLinkItem key={presence.slug} presence={presence} locale={locale} />
              ))}

              {available.length > 8 && <PresenceItemMore count={available.length - 8} label={t("more-to-discover")} />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

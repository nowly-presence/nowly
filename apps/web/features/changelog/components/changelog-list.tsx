"use client";

import { Link } from "@/i18n/navigation";
import type { ChangelogRelease } from "@/features/changelog/lib/changelog-releases";
import { formatChangelogDate } from "@/features/changelog/lib/format-changelog-date";
import type { ChangelogStore } from "@nowly/changelog";
import { cn } from "@nowly/ui";
import { RiChromeFill, RiFirefoxBrowserFill } from "@nowly/ui/icons";
import { useTranslations } from "next-intl";
import { useState } from "react";

type Props = {
  releases: ChangelogRelease[]
  latestByStore: Partial<Record<ChangelogStore, string>>
  locale: string
};

const storeIcon: Record<ChangelogStore, typeof RiChromeFill> = {
  chrome: RiChromeFill,
  firefox: RiFirefoxBrowserFill,
};

export const ChangelogList = ({ releases, latestByStore, locale }: Props) => {
  const t = useTranslations("changelogPage");
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  return (
    <ol>
      {releases.map((release, index) => {
        const stores = release.stores ?? [];
        const isHovered = hoveredSlug === release.slug;
        const isOtherHovered = hoveredSlug !== null && !isHovered;
        const isLatest = (store: ChangelogStore) => latestByStore[store] === release.slug;

        return (
          <li key={release.slug} className={index > 0 ? "border-t border-border" : undefined}>
            <Link
              href={`/changelog/${release.version}`}
              onMouseEnter={() => setHoveredSlug(release.slug)}
              onMouseLeave={() => setHoveredSlug(null)}
              className="group flex flex-col gap-2 py-6 outline-offset-4 sm:flex-row sm:items-baseline sm:gap-8"
            >
              <span className="flex shrink-0 flex-col gap-1.5 sm:w-36">
                <span className="font-mono text-sm font-medium text-foreground">{release.version}</span>
                {stores.length > 0 ? (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    {stores.map((store) => {
                      const Icon = storeIcon[store];
                      const dimmed = isOtherHovered || (!isHovered && !isLatest(store));
                      return (
                        <span key={store} title={t(store === "chrome" ? "current-on-chrome" : "current-on-firefox")}>
                          <Icon className={cn("size-4 transition-opacity", dimmed ? "opacity-10" : "opacity-100")} />
                        </span>
                      );
                    })}
                  </span>
                ) : null}
              </span>
              <div className="min-w-0 flex-1">
                {release.date ? (
                  <p className="text-xs text-muted-foreground">{formatChangelogDate(release.date, locale)}</p>
                ) : null}
                <p className="mt-1 text-[0.95rem] leading-relaxed text-foreground/75 group-hover:text-foreground">
                  {release.summary}
                </p>
                <p className="mt-2 text-sm font-medium text-accent">{t("read")}</p>
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
};

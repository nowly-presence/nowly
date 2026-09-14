"use client";

import type { DocNavigationItem } from "@/lib/docs/types";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC } from "react";

type PageNavigationProps = {
  prev: DocNavigationItem | null;
  next: DocNavigationItem | null;
};

export const PageNavigation: FC<PageNavigationProps> = ({ prev, next }) => {
  const t = useTranslations("docs");

  return (
    <nav className="mt-16 flex items-center border-t border-border pt-8">
      {prev && (
        <div className="flex-1">
          <Link
            href={`/docs/${prev.slug}`}
            className="group flex flex-col gap-1 rounded-lg p-3 transition-colors hover:bg-card-hover"
          >
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <IconChevronLeft size={14} />
              {t("previous")}
            </span>

            <span className="text-sm font-medium group-hover:text-accent transition-colors">
              {prev.title}
            </span>
          </Link>
        </div>
      )}

      {next && (
        <div className="flex-1 text-right">
          <Link
            href={`/docs/${next.slug}`}
            className="group flex flex-col gap-1 rounded-lg p-3 transition-colors hover:bg-card-hover"
          >
            <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
              {t("next")}
              <IconChevronRight size={14} />
            </span>

            <span className="text-sm font-medium group-hover:text-accent transition-colors">
              {next.title}
            </span>
          </Link>
        </div>
      )}
    </nav>
  );
};
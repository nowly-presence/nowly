"use client";

import type { TocItem } from "@/lib/docs/types";
import { cn } from "@/lib/utils";
import { IconListTree, IconX } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, type FC } from "react";

type TableOfContentsProps = {
  items: TocItem[];
};

export const TableOfContents: FC<TableOfContentsProps> = ({ items }) => {
  const t = useTranslations("docs");
  const [activeId, setActiveId] = useState<string>("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );

    const headings = document.querySelectorAll("h2, h3");
    headings.forEach((h) => observer.observe(h));

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <>
      <nav className="hidden xl:block fixed top-24 w-56 max-h-[calc(100vh-8rem)] overflow-y-auto" style={{ right: "max(1rem, calc((100vw - 1280px) / 2 + 1rem))" }}>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {t("on-this-page")}
        </p>
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={cn(
                  "block text-sm transition-colors py-0.5 border-l-2 pl-3",
                  item.level === 3 && "pl-6",
                  activeId === item.id
                    ? "text-accent border-accent font-medium"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:border-border-light"
                )}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="xl:hidden fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-accent text-background px-4 py-3 shadow-lg"
        aria-label={t("open-table-of-contents")}
      >
        <IconListTree size={18} />
        <span className="text-sm font-medium">{t("toc")}</span>
      </button>

      {mobileOpen && (
        <div className="xl:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-xl p-6 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t("on-this-page")}
              </p>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <IconX size={20} />
              </button>
            </div>
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "block text-sm transition-colors py-1 border-l-2 pl-3",
                      item.level === 3 && "pl-6",
                      activeId === item.id
                        ? "text-accent border-accent"
                        : "text-muted-foreground border-transparent hover:text-foreground"
                    )}
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};
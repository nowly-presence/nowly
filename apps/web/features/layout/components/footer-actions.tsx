"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";

type FooterComponents = {
  LocaleSelector: ComponentType;
  ThemeToggle: ComponentType;
};

export const FooterActions = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [components, setComponents] = useState<FooterComponents | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        Promise.all([
          import("@nowly/ui/locale-selector"),
          import("@/features/layout/components/theme-toggle"),
        ]).then(([localeModule, themeModule]) => {
          setComponents({
            LocaleSelector: localeModule.LocaleSelector,
            ThemeToggle: themeModule.ThemeToggle,
          });
        });
      },
      { rootMargin: "300px" },
    );
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="flex min-h-9 items-center gap-2">
      {components ? (
        <>
          <components.LocaleSelector />
          <components.ThemeToggle />
        </>
      ) : null}
    </div>
  );
};

"use client";

import { Link } from "@/i18n/navigation";
import { AnimatePresence, LazyMotion, m, MotionConfig } from "motion/react";
import { useId, useState, type FocusEvent } from "react";

type NavbarLink = { href: string; label: string; external: boolean };

// Loaded after hydration so the animation code stays out of every page's critical bundle.
const loadMotionFeatures = () => import("@/features/layout/lib/motion-features").then((module) => module.default);

const LINK_CLASS = "relative rounded-lg px-3 py-1.5 text-sm text-foreground";

// Desktop-only: one soft pill that glides from link to link while hovering (or tabbing through) the nav.
export const NavbarLinks = ({ links }: { links: NavbarLink[] }) => {
  const pillId = useId();
  const [hovered, setHovered] = useState<string | null>(null);

  const handlers = (href: string) => ({
    onMouseEnter: () => setHovered(href),
    onFocus: (event: FocusEvent<HTMLElement>) => {
      if (event.currentTarget.matches(":focus-visible")) setHovered(href);
    },
    onBlur: (event: FocusEvent<HTMLElement>) => {
      if (!event.currentTarget.parentElement?.matches(":hover")) setHovered((current) => (current === href ? null : current));
    },
  });

  const content = (link: NavbarLink) => (
    <>
      <AnimatePresence>
        {hovered === link.href ? (
          <m.span
            aria-hidden
            layoutId={pillId}
            className="absolute inset-0 rounded-lg bg-foreground/8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
          />
        ) : null}
      </AnimatePresence>
      <span className="relative">{link.label}</span>
    </>
  );

  return (
    <LazyMotion features={loadMotionFeatures}>
      <MotionConfig reducedMotion="user">
        <div className="flex items-center gap-2" onMouseLeave={() => setHovered(null)}>
          {links.map((link) =>
            link.external ? (
              <a key={link.href} href={link.href} className={LINK_CLASS} rel="noreferrer" target="_blank" {...handlers(link.href)}>
                {content(link)}
              </a>
            ) : (
              <Link key={link.href} href={link.href} className={LINK_CLASS} {...handlers(link.href)}>
                {content(link)}
              </Link>
            ),
          )}
        </div>
      </MotionConfig>
    </LazyMotion>
  );
};

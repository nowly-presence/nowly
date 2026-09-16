"use client";

import { PresenceCard } from "@/components/home/presence-card";
import { HERO_PRESENCE_CARDS } from "@/components/home/hero-presence-cards";
import { useEffect, useRef } from "react";

const COUNT = HERO_PRESENCE_CARDS.length;
const STEP = (Math.PI * 2) / COUNT;
const PERIOD_MS = 36000;
const OPAQUE_ARC = STEP * 1.05;
const SCALE_ARC = STEP * 2.35;
const GHOST_ARC = STEP * 2.7;
const HIDE_ARC = STEP * 3.55;
const DESKTOP_QUERY = "(min-width: 1024px)";

const shortest = (delta: number) => {
  const wrapped = ((((delta + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
  return wrapped;
};

const smoothstep = (value: number) => {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
};

export const HeroCards = () => {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const items = [...stage.querySelectorAll<HTMLElement>("[data-gondola]")];
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let roomRight = 0;
    let frame = 0;
    let origin = 0;

    const measure = () => {
      const rect = stage.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      roomRight = Math.max(width, window.innerWidth - rect.left);
    };

    const layout = (spin: number) => {
      const front = Math.PI;
      const cardW = Math.min(width * 0.92, 480);
      const rx = Math.min(roomRight * 0.4, width * 0.95);
      const ry = Math.min(rx * 0.92, height * 0.45);
      const cx = width * 0.4 + rx;
      const cy = height * 0.52;

      for (let i = 0; i < items.length; i++) {
        const el = items[i];
        const angle = spin + i * STEP;
        const absDelta = Math.abs(shortest(angle - front));

        let opacity = 1;
        if (absDelta > HIDE_ARC) opacity = 0;
        else if (absDelta > GHOST_ARC) opacity = 0.32 * (1 - smoothstep((absDelta - GHOST_ARC) / (HIDE_ARC - GHOST_ARC)));
        else if (absDelta > OPAQUE_ARC) opacity = 1 - 0.68 * smoothstep((absDelta - OPAQUE_ARC) / (GHOST_ARC - OPAQUE_ARC));

        const proximity = 1 - Math.min(absDelta / SCALE_ARC, 1);
        const scale = 0.62 + 0.38 * proximity ** 0.85;
        const x = cx + Math.cos(angle) * rx;
        const y = cy + Math.sin(angle) * ry;
        const half = (cardW * scale) / 2;
        const left = x - half;

        if (left >= roomRight) opacity = 0;
        else if (x + half > roomRight) opacity *= smoothstep((roomRight - left) / Math.max(half * 2, 1));

        el.style.width = `${cardW}px`;
        el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
        el.style.opacity = String(opacity);
        el.style.zIndex = String(Math.round(proximity * 100));
        el.style.filter = absDelta > OPAQUE_ARC && opacity > 0 ? `blur(${((absDelta - OPAQUE_ARC) * 2.4).toFixed(2)}px)` : "none";
        el.style.visibility = opacity < 0.01 ? "hidden" : "visible";
      }
    };

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const tick = (now: number) => {
      if (!desktop.matches) {
        stop();
        return;
      }
      layout(Math.PI + ((now - origin) / PERIOD_MS) * Math.PI * 2);
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!desktop.matches) return;
      measure();
      if (reduced) {
        layout(Math.PI);
        return;
      }
      stop();
      origin = performance.now();
      frame = requestAnimationFrame(tick);
    };

    const observer = new ResizeObserver(() => {
      measure();
      if (desktop.matches && reduced) layout(Math.PI);
    });
    observer.observe(stage);
    window.addEventListener("resize", measure);
    desktop.addEventListener("change", start);

    const onVisibility = () => {
      if (document.hidden) {
        stop();
        return;
      }
      start();
    };

    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      observer.disconnect();
      window.removeEventListener("resize", measure);
      desktop.removeEventListener("change", start);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div ref={stageRef} className="relative isolate hidden h-[min(58vh,560px)] w-full overflow-visible lg:block">
      <div
        className="pointer-events-none absolute left-[18%] top-1/2 h-[70%] w-[58%] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.24),transparent_68%)] blur-3xl"
        aria-hidden
      />
      {HERO_PRESENCE_CARDS.map((config) => (
        <div
          key={config.id}
          data-gondola
          className="absolute top-0 left-0 origin-center will-change-transform"
          style={{ opacity: 0, visibility: "hidden" }}
        >
          <PresenceCard config={config} />
        </div>
      ))}
    </div>
  );
};

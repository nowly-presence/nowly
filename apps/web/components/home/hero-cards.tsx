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
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let roomRight = 0;
    let compact = false;

    const measure = () => {
      const rect = stage.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      roomRight = Math.max(width, window.innerWidth - rect.left);
      compact = window.innerWidth < 1024;
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    window.addEventListener("resize", measure);

    const layout = (spin: number) => {
      const front = compact ? Math.PI / 2 : Math.PI;
      const cardW = compact ? Math.min(width * 0.94, 340) : Math.min(width * 0.92, 480);
      const rx = compact ? width * 0.16 : Math.min(roomRight * 0.4, width * 0.95);
      const ry = compact ? height * 0.32 : Math.min(rx * 0.92, height * 0.45);
      const cx = compact ? width * 0.5 : width * 0.4 + rx;
      const cy = compact ? height * 0.6 - ry : height * 0.52;

      for (let i = 0; i < items.length; i++) {
        const el = items[i];
        const angle = spin + i * STEP;
        const absDelta = Math.abs(shortest(angle - front));

        let opacity = 1;
        if (absDelta > HIDE_ARC) opacity = 0;
        else if (absDelta > GHOST_ARC) opacity = 0.32 * (1 - smoothstep((absDelta - GHOST_ARC) / (HIDE_ARC - GHOST_ARC)));
        else if (absDelta > OPAQUE_ARC) opacity = 1 - 0.68 * smoothstep((absDelta - OPAQUE_ARC) / (GHOST_ARC - OPAQUE_ARC));

        const proximity = 1 - Math.min(absDelta / SCALE_ARC, 1);
        const scale = (compact ? 0.72 : 0.62) + (compact ? 0.28 : 0.38) * proximity ** 0.85;
        const x = cx + Math.cos(angle) * rx;
        const y = cy + Math.sin(angle) * ry;
        const half = (cardW * scale) / 2;
        const left = x - half;
        const edge = compact ? width : roomRight;

        if (left >= edge) opacity = 0;
        else if (x + half > edge) opacity *= smoothstep((edge - left) / Math.max(half * 2, 1));
        if (compact && left < 0) opacity *= smoothstep((x + half) / Math.max(half * 2, 1));

        el.style.width = `${cardW}px`;
        el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
        el.style.opacity = String(opacity);
        el.style.zIndex = String(Math.round(proximity * 100));
        el.style.filter = absDelta > OPAQUE_ARC && opacity > 0 ? `blur(${((absDelta - OPAQUE_ARC) * (compact ? 1.4 : 2.4)).toFixed(2)}px)` : "none";
        el.style.visibility = opacity < 0.01 ? "hidden" : "visible";
      }
    };

    if (reduced) {
      layout(compact ? Math.PI / 2 : Math.PI);
      return () => {
        observer.disconnect();
        window.removeEventListener("resize", measure);
      };
    }

    let frame = 0;
    const origin = performance.now();

    const tick = (now: number) => {
      layout((compact ? Math.PI / 2 : Math.PI) + ((now - origin) / PERIOD_MS) * Math.PI * 2);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", measure);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div ref={stageRef} className="relative isolate h-[210px] w-full overflow-hidden sm:h-[260px] lg:h-[min(58vh,560px)] lg:overflow-visible">
      <div
        className="pointer-events-none absolute left-1/2 top-[58%] h-[70%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.24),transparent_68%)] blur-3xl lg:left-[18%] lg:top-1/2 lg:w-[58%] lg:translate-x-0"
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

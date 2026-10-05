"use client";

import "@/features/seasonal/season-decor.css";
import type { SiteSeason } from "@/features/seasonal/lib/site-season";
import { buildParticles, SEASON_SCENES } from "@/features/seasonal/components/season-scenes";
import { useEffect, useMemo, useState } from "react";

const VIEWBOX = "0 0 24 24";
const REST_SPOTS = ["season-rest-a", "season-rest-b", "season-rest-c"] as const;

const Shape = ({ path, className }: { path: string; className?: string }) => (
  <svg viewBox={VIEWBOX} className={className} aria-hidden>
    <path d={path} fill="currentColor" stroke="currentColor" strokeWidth={1} strokeLinejoin="round" />
  </svg>
);

const useHidden = (): boolean => {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const update = () => setHidden(document.visibilityState === "hidden");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return hidden;
};

export const SeasonDecor = ({ season }: { season: SiteSeason }) => {
  const scene = SEASON_SCENES[season];
  const particles = useMemo(() => buildParticles(scene), [scene]);
  const hidden = useHidden();

  return (
    <div aria-hidden className="season-decor" data-paused={hidden ? "" : undefined}>
      <div className="season-glow season-glow-top" />
      <div className="season-glow season-glow-bottom" />
      {scene.frost ? <div className="season-frost" /> : null}
      {scene.rest.map((path, index) => (
        <Shape key={REST_SPOTS[index]} path={path} className={`season-rest ${REST_SPOTS[index]}`} />
      ))}
      <div className={`season-sky season-sky-${scene.motion}`}>
        {particles.map((particle) => (
          <span
            key={particle.id}
            className={`season-particle season-particle-${particle.side}`}
            style={{
              "--offset": particle.offset,
              "--size": `${particle.size}px`,
              "--duration": `${particle.duration}s`,
              "--delay": `${particle.delay}s`,
              "--sway": `${particle.sway}px`,
              "--spin": `${particle.spin}deg`,
              "--tone": `var(--season-tone-${particle.tone})`,
            }}
          >
            <span className="season-particle-sway">
              <Shape path={particle.path} className="season-particle-shape" />
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

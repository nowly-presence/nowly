import type { SiteSeason } from "@/features/seasonal/lib/site-season";
import {
  BLOSSOM_PATH,
  CONFETTI_PATH,
  DOT_PATH,
  LEAF_PATH,
  MAPLE_PATH,
  PETAL_PATH,
  ROUND_LEAF_PATH,
  SNOWFLAKE_PATH,
  SPARKLE_PATH,
  STAR_PATH,
} from "@/features/seasonal/components/season-shapes";

export type SeasonMotion = "fall" | "rise";

export type SeasonScene = {
  shapes: readonly string[]
  rest: readonly string[]
  motion: SeasonMotion
  minSize: number
  maxSize: number
  minDuration: number
  maxDuration: number
  sway: number
  spin: number
  frost: boolean
};

const LEAVES = [MAPLE_PATH, LEAF_PATH, ROUND_LEAF_PATH] as const;

export const SEASON_SCENES: Record<SiteSeason, SeasonScene> = {
  autumn: { shapes: LEAVES, rest: [MAPLE_PATH, ROUND_LEAF_PATH], motion: "fall", minSize: 16, maxSize: 30, minDuration: 14, maxDuration: 24, sway: 14, spin: 160, frost: false },
  halloween: { shapes: LEAVES, rest: [MAPLE_PATH, LEAF_PATH], motion: "fall", minSize: 16, maxSize: 30, minDuration: 14, maxDuration: 24, sway: 14, spin: 160, frost: false },
  winter: { shapes: [SNOWFLAKE_PATH, DOT_PATH, SNOWFLAKE_PATH], rest: [SNOWFLAKE_PATH, SPARKLE_PATH], motion: "fall", minSize: 8, maxSize: 20, minDuration: 16, maxDuration: 28, sway: 10, spin: 90, frost: true },
  spring: { shapes: [PETAL_PATH, BLOSSOM_PATH, PETAL_PATH], rest: [BLOSSOM_PATH, ROUND_LEAF_PATH], motion: "fall", minSize: 12, maxSize: 22, minDuration: 15, maxDuration: 26, sway: 16, spin: 200, frost: false },
  summer: { shapes: [DOT_PATH, SPARKLE_PATH, DOT_PATH], rest: [SPARKLE_PATH, DOT_PATH], motion: "rise", minSize: 6, maxSize: 16, minDuration: 18, maxDuration: 30, sway: 10, spin: 40, frost: false },
  "new-year": { shapes: [CONFETTI_PATH, STAR_PATH, CONFETTI_PATH, SPARKLE_PATH], rest: [STAR_PATH, SPARKLE_PATH], motion: "fall", minSize: 10, maxSize: 18, minDuration: 12, maxDuration: 20, sway: 12, spin: 320, frost: false },
};

export type SeasonParticle = {
  id: number
  path: string
  side: "left" | "right"
  offset: number
  size: number
  duration: number
  delay: number
  sway: number
  spin: number
  tone: number
};

const PARTICLE_COUNT = 14;
const TONE_COUNT = 4;
const SEED = 7;

const random = (seed: number) => {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

export const buildParticles = (scene: SeasonScene, count = PARTICLE_COUNT): SeasonParticle[] => {
  const next = random(SEED);
  return Array.from({ length: count }, (_, id) => {
    const duration = scene.minDuration + next() * (scene.maxDuration - scene.minDuration);
    return {
      id,
      path: scene.shapes[id % scene.shapes.length],
      side: id % 2 === 0 ? "left" : "right",
      offset: Math.round(next() * 80) / 100,
      size: Math.round(scene.minSize + next() * (scene.maxSize - scene.minSize)),
      duration: Math.round(duration * 10) / 10,
      delay: -Math.round(next() * duration * 10) / 10,
      sway: Math.round(scene.sway * (0.5 + next() * 0.5)),
      spin: Math.round(scene.spin * (next() > 0.5 ? 1 : -1) * (0.4 + next() * 0.6)),
      tone: (id % TONE_COUNT) + 1,
    };
  });
};

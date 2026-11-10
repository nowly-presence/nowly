import { BLOSSOM_PATH, CONFETTI_PATH, DOT_PATH, LEAF_PATH, MAPLE_PATH, PETAL_PATH, ROUND_LEAF_PATH, SNOWFLAKE_PATH, SPARKLE_PATH, STAR_PATH, SUN_PATH } from "@nowly/shared/season-shapes";
import type { Season } from "@nowly/shared/seasons";

export type SeasonShape = {
  d: string;
  fill: string;
};

export const SEASON_SHAPES = {
  spring: [
    {
      d: PETAL_PATH,
      fill: "var(--season-accent)"
    },
    {
      d: BLOSSOM_PATH,
      fill: "var(--season-shape)"
    },
    {
      d: ROUND_LEAF_PATH,
      fill: "var(--primary)"
    }
  ],
  summer: [
    {
      d: SUN_PATH,
      fill: "var(--season-shape)"
    },
    {
      d: SPARKLE_PATH,
      fill: "var(--primary)"
    },
    {
      d: DOT_PATH,
      fill: "var(--season-accent)"
    }
  ],
  autumn: [
    {
      d: MAPLE_PATH,
      fill: "var(--primary)"
    },
    {
      d: LEAF_PATH,
      fill: "var(--season-accent)"
    },
    {
      d: ROUND_LEAF_PATH,
      fill: "var(--season-shape)"
    }
  ],
  winter: [
    {
      d: SNOWFLAKE_PATH,
      fill: "var(--season-accent)"
    },
    {
      d: SPARKLE_PATH,
      fill: "var(--season-shape)"
    },
    {
      d: DOT_PATH,
      fill: "var(--primary)"
    }
  ],
  "new-year": [
    {
      d: STAR_PATH,
      fill: "var(--primary)"
    },
    {
      d: CONFETTI_PATH,
      fill: "var(--season-accent)"
    },
    {
      d: SPARKLE_PATH,
      fill: "var(--season-shape)"
    }
  ],
  halloween: [
    {
      d: MAPLE_PATH,
      fill: "var(--primary)"
    },
    {
      d: LEAF_PATH,
      fill: "var(--season-accent)"
    },
    {
      d: STAR_PATH,
      fill: "var(--season-shape)"
    }
  ]
} as const satisfies Record<Season, readonly SeasonShape[]>;
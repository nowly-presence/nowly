export const SEASONS = ["spring", "summer", "autumn", "winter", "halloween", "new-year"] as const;

export type Season = (typeof SEASONS)[number];

export const isSeason = (value: unknown): value is Season => SEASONS.some((season) => season === value);
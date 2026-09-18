export const FUNNEL_IDS = ["acquisition-marketplace", "activation", "native", "uninstall"] as const;
export type FunnelId = (typeof FUNNEL_IDS)[number];

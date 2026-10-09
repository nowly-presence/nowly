export type AdPlacement = "guides";

// NEXT_PUBLIC_* values are inlined at build time (see the ARGs in apps/web/Dockerfile).
const CLIENT_ID = (process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? "").trim();
const ENABLED = (process.env.NEXT_PUBLIC_ADSENSE_ENABLED ?? "").trim().toLowerCase() === "true";

const SLOTS: Record<AdPlacement, string> = {
  guides: (process.env.NEXT_PUBLIC_ADSENSE_GUIDES_SLOT ?? "").trim(),
};

const CLIENT_PATTERN = /^ca-pub-\d{10,20}$/;

// "ca-pub-123..." as given by AdSense, or null when unset or malformed.
export const adsenseClientId = (): string | null => (CLIENT_PATTERN.test(CLIENT_ID) ? CLIENT_ID : null);

// ads.txt wants the publisher ID without the "ca-" prefix.
export const adsensePublisherId = (): string | null => adsenseClientId()?.replace(/^ca-/, "") ?? null;

export const adsenseSlot = (placement: AdPlacement): string | null => {
  if (!ENABLED || !adsenseClientId()) return null;
  return /^\d{5,20}$/.test(SLOTS[placement]) ? SLOTS[placement] : null;
};

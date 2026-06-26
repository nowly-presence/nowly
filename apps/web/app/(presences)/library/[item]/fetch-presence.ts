import type { Metadata as PresenceMetadata } from "@nowly/sdk/metadata";

export interface PresenceRelease {
  slug: string
  version: string
  metadata: PresenceMetadata
  totalInstalls?: number
  activeUsers?: number
  addedAt?: string
  lastUpdated?: string
}

export const fetchPresence = async (apiUrl: string, slug: string): Promise<PresenceRelease | null> => {
  try {
    const res = await fetch(`${apiUrl}/presences/${slug}`, {
      next: { revalidate: 60 },
    });

    if (res.ok) return await res.json() as PresenceRelease;
  } catch {
    // API unreachable
  }
  return null;
};
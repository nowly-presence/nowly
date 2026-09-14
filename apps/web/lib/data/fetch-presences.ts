import { API_BASE_URL } from "@/lib/constants";
import type { Presence } from "@/lib/data/presences";
import { metadataToPlatform } from "@/lib/data/presence-adapter";
import type { Metadata } from "@nowly/sdk/metadata";

export const fetchPresences = async (): Promise<Presence[]> => {
  const res = await fetch(`${API_BASE_URL}/presences`);

  if (!res.ok) throw new Error("Failed to fetch presences");

  const metadata: Metadata[] = await res.json();

  return metadata.map(metadataToPlatform);
};

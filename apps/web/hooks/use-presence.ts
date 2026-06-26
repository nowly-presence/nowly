"use client";

import { API_BASE_URL } from "@/lib/constants";
import { metadataToPlatform } from "@/lib/data/presence-adapter";
import type { Presence } from "@/lib/data/presences";
import type { Metadata } from "@nowly/sdk/metadata";
import { useQuery } from "@tanstack/react-query";

const presenceKey = (slug: string) => ["presence", slug] as const;

const fetchPresence = async (slug: string): Promise<Presence | null> => {
  const res = await fetch(`${API_BASE_URL}/presences/${slug}`);

  if (!res.ok) return null;

  const data = await res.json() as { metadata: Metadata } | null;

  if (!data?.metadata) return null;

  return metadataToPlatform(data.metadata);
};

const usePresence = (slug: string, initialData?: Presence) => {
  return useQuery<Presence | null>({
    queryKey: presenceKey(slug),
    queryFn: () => fetchPresence(slug),
    staleTime: 5 * 60 * 1000,
    initialData: initialData ?? undefined,
  });
};

export { fetchPresence, presenceKey, usePresence };

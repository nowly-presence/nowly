"use client";

import { API_BASE_URL } from "@/lib/constants";
import type { Presence } from "@/lib/data/presences";
import { metadataToPlatform } from "@/lib/data/presence-adapter";
import type { Metadata } from "@nowly/sdk/metadata";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

const PRESENCES_KEY = ["presences"] as const;

const fetchPresences = async (): Promise<Presence[]> => {
  const res = await fetch(`${API_BASE_URL}/presences`);

  if (!res.ok) throw new Error("Failed to fetch presences");

  const metadata: Metadata[] = await res.json();

  return metadata.map(metadataToPlatform);
};

const usePresences = () => {
  return useQuery<Presence[]>({
    queryKey: PRESENCES_KEY,
    queryFn: fetchPresences,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

export { fetchPresences, PRESENCES_KEY, usePresences };

"use client";

import { fetchPresences } from "@/lib/data/fetch-presences";
import type { Presence } from "@/lib/data/presences";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

const PRESENCES_KEY = ["presences"] as const;

const usePresences = () => {
  return useQuery<Presence[]>({
    queryKey: PRESENCES_KEY,
    queryFn: fetchPresences,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

export { fetchPresences, PRESENCES_KEY, usePresences };

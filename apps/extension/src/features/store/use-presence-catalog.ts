import { sendMessage } from "@/lib/messages";
import type { PresenceCatalogItem } from "@/shared/types";
import { useCallback, useEffect, useState } from "react";
import { toStorePresence, type StorePresence } from "@/features/store/store.model";

const CATALOG_TTL_MS = 5 * 60 * 1000;

type CatalogCache = {
  at: number;
  items: StorePresence[];
};

type CatalogResponse = {
  ok?: boolean;
  items?: PresenceCatalogItem[];
  error?: string;
};

let catalogCache: CatalogCache | null = null;

export const usePresenceCatalog = () => {
  const [items, setItems] = useState<StorePresence[]>(catalogCache?.items ?? []);
  const [isLoading, setIsLoading] = useState(!catalogCache);
  const [isError, setIsError] = useState(false);

  const load = useCallback(async (force = false): Promise<void> => {
    if (!force && catalogCache && Date.now() - catalogCache.at < CATALOG_TTL_MS) {
      setItems(catalogCache.items);
      setIsLoading(false);
      setIsError(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);
    const response = await sendMessage<CatalogResponse>("FETCH_PRESENCE_CATALOG");
    if (!response?.ok || !Array.isArray(response.items)) {
      setIsError(true);
      setIsLoading(false);
      return;
    }

    const nextItems = response.items.map(toStorePresence);
    catalogCache = { at: Date.now(), items: nextItems };
    setItems(nextItems);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    items,
    isError,
    isLoading,
    refetch: () => load(true),
  };
};

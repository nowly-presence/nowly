import { useCallback, useEffect, useState } from "react";
import { sendMessage } from "@/lib/messages";
import type { HiddenPresence } from "@/shared/admin/admin-types";

export const useHiddenPresences = (enabled: boolean) => {
  const [items, setItems] = useState<HiddenPresence[] | null>(null);

  const reload = useCallback(async () => {
    const result = await sendMessage("ADMIN_FETCH_HIDDEN_PRESENCES");
    setItems(result.ok ? result.data : []);
  }, []);

  useEffect(() => {
    if (enabled) void reload();
  }, [enabled, reload]);

  return { items, reload };
};

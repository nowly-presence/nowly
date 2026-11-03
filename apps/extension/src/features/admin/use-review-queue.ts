import { useCallback, useEffect, useState } from "react";
import { sendMessage } from "@/lib/messages";
import type { AdminError, QueueItem } from "@/shared/admin/admin-types";

export const useReviewQueue = (enabled: boolean) => {
  const [items, setItems] = useState<QueueItem[] | null>(null);
  const [error, setError] = useState<AdminError | null>(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const result = await sendMessage("ADMIN_FETCH_QUEUE");
    setLoading(false);

    if (result.ok) {
      setItems(result.data);
      setError(null);
    } else setError(result.error);
  }, []);

  useEffect(() => {
    if (enabled) void reload();
  }, [enabled, reload]);

  return { items, error, loading, reload };
};
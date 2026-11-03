import { useEffect, useState } from "react";
import { sendMessage } from "@/lib/messages";

export const useCreatorPresenceProbe = (slug: string | null, enabled: boolean): boolean => {
  const [published, setPublished] = useState(false);

  useEffect(() => {
    setPublished(false);

    if (!slug || !enabled) return;

    let cancelled = false;
    void sendMessage("ADMIN_PROBE_CREATOR_PRESENCE", { slug }).then((result) => {
      if (!cancelled) setPublished(result.ok);
    });
    return () => {
      cancelled = true;
    };
  }, [slug, enabled]);

  return published;
};
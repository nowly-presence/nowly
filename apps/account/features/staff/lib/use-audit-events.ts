"use client";

import { fetchAuditEvents, type AuditEvent } from "@/features/staff/lib/staff-api";
import { useCallback, useEffect, useState } from "react";

export const useAuditEvents = () => {
  const [events, setEvents] = useState<AuditEvent[] | null>(null);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchAuditEvents()
      .then((page) => {
        setEvents(page);
        setDone(page.length === 0);
      })
      .catch(() => setFailed(true));
  }, []);

  const loadMore = useCallback((): Promise<void> => {
    const last = events?.at(-1);

    if (!last || done) return Promise.resolve();

    setBusy(true);
    return fetchAuditEvents(last.createdAt)
      .then((page) => {
        setEvents((current) => [...(current ?? []), ...page]);
        setDone(page.length === 0);
      })
      .catch(() => setFailed(true))
      .finally(() => setBusy(false));
  }, [events, done]);

  return { events, done, failed, busy, loadMore };
};

"use client";

import type { SiteSeason } from "@/features/seasonal/lib/site-season";
import { startSiteSeason } from "@/features/seasonal/lib/site-season-sync";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const SeasonDecor = dynamic(() => import("@/features/seasonal/components/season-decor").then((module) => module.SeasonDecor), { ssr: false });

const DECOR_IDLE_TIMEOUT_MS = 1500;

const whenIdle = (callback: () => void): (() => void) => {
  if (typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(callback, { timeout: DECOR_IDLE_TIMEOUT_MS });
    return () => window.cancelIdleCallback(handle);
  }

  const timer = window.setTimeout(callback, DECOR_IDLE_TIMEOUT_MS);
  return () => window.clearTimeout(timer);
};

export const SeasonProvider = ({ allowPreview }: {
  allowPreview: boolean;
}) => {
  const [season, setSeason] = useState<SiteSeason | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => whenIdle(() => setReady(true)), []);

  useEffect(() =>
    startSiteSeason({
      allowPreview,
      onChange: setSeason
    }), [allowPreview]);

  return season && ready ? <SeasonDecor season={season} /> : null;
};
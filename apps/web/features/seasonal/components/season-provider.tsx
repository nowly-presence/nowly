"use client";

import {
  applySeasonClass,
  EXT_SOURCE,
  initialSeasonState,
  nextSeasonState,
  parseSeasonMessage,
  parseSeasonPreview,
  readStoredSeason,
  SEASON_FADE_MS,
  SEASON_LEAVING_CLASS,
  SEASON_REQUEST,
  SEASON_RESPONSE_TIMEOUT_MS,
  SEASON_STORAGE_KEY,
  seasonToStore,
  type SeasonEvent,
  type SeasonState,
  type SiteSeason,
} from "@/features/seasonal/lib/site-season";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const SeasonDecor = dynamic(() => import("@/features/seasonal/components/season-decor").then((module) => module.SeasonDecor), { ssr: false });

const DECOR_IDLE_TIMEOUT_MS = 1500;

const readStorage = (): string | null => {
  try {
    return window.localStorage.getItem(SEASON_STORAGE_KEY);
  } catch {
    return null;
  }
};

const writeStorage = (season: SiteSeason | null): void => {
  try {
    if (season) window.localStorage.setItem(SEASON_STORAGE_KEY, season);
    else window.localStorage.removeItem(SEASON_STORAGE_KEY);
  } catch {
    return;
  }
};

const whenIdle = (callback: () => void): (() => void) => {
  if (typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(callback, { timeout: DECOR_IDLE_TIMEOUT_MS });
    return () => window.cancelIdleCallback(handle);
  }
  const timer = window.setTimeout(callback, DECOR_IDLE_TIMEOUT_MS);
  return () => window.clearTimeout(timer);
};

const requestSeason = (): void => {
  window.postMessage({ source: EXT_SOURCE, type: SEASON_REQUEST }, window.location.origin);
};

export const SeasonProvider = ({ allowPreview }: { allowPreview: boolean }) => {
  const [season, setSeason] = useState<SiteSeason | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => whenIdle(() => setReady(true)), []);

  useEffect(() => {
    const root = document.documentElement;
    let state: SeasonState = initialSeasonState({
      stored: readStoredSeason(readStorage()),
      preview: allowPreview ? parseSeasonPreview(window.location.search) : null,
    });
    let fadeTimer: number | null = null;
    let fadeFrame: number | null = null;

    const cancelFade = () => {
      if (fadeTimer !== null) window.clearTimeout(fadeTimer);
      if (fadeFrame !== null) window.cancelAnimationFrame(fadeFrame);
      fadeTimer = null;
      fadeFrame = null;
      root.classList.remove(SEASON_LEAVING_CLASS);
    };

    const show = (next: SiteSeason | null) => {
      cancelFade();
      applySeasonClass(root.classList, next);
      setSeason(next);
    };

    const fadeOut = () => {
      cancelFade();
      root.classList.add(SEASON_LEAVING_CLASS);
      fadeFrame = window.requestAnimationFrame(() => applySeasonClass(root.classList, null));
      fadeTimer = window.setTimeout(() => {
        root.classList.remove(SEASON_LEAVING_CLASS);
        setSeason(null);
      }, SEASON_FADE_MS);
    };

    const commit = (event: SeasonEvent) => {
      const previous = state.season;
      state = nextSeasonState(state, event);
      const stored = seasonToStore(state);
      if (stored !== undefined) writeStorage(stored);
      if (state.season === previous) return;
      if (state.season === null) fadeOut();
      else show(state.season);
    };

    show(state.season);
    if (state.source === "preview") return cancelFade;

    const timeout = window.setTimeout(() => commit({ type: "timeout" }), SEASON_RESPONSE_TIMEOUT_MS);

    const onMessage = (event: MessageEvent) => {
      if (event.source !== window || event.origin !== window.location.origin) return;
      const message = parseSeasonMessage(event.data);
      if (!message) return;
      window.clearTimeout(timeout);
      commit({ type: "extension", season: message.season });
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") requestSeason();
    };

    window.addEventListener("message", onMessage);
    document.addEventListener("visibilitychange", onVisible);
    requestSeason();

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      document.removeEventListener("visibilitychange", onVisible);
      cancelFade();
    };
  }, [allowPreview]);

  return season && ready ? <SeasonDecor season={season} /> : null;
};

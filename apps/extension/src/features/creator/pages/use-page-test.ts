import { useCallback, useEffect, useRef, useState } from "react";
import { sendMessage } from "@/lib/messages";
import { buildPreviewActivity, matchesPage, type CreatorPreview } from "@nowly/presence-creator/creator-activity";
import type { CreatorDraft, CreatorPage } from "@nowly/presence-creator/creator-types";
import type { LongLocale } from "@/shared/locales";

const TICK_MS = 3000;

export type PageTestState = {
  status: "idle";
} | {
  status: "error";
  error: "NO_TAB" | "UNREACHABLE";
} | {
  status: "ready";
  preview: CreatorPreview;
  matches: boolean;
  url: string;
};

export type DiscordTestError = "PAUSED" | "NO_HOST" | null;

export const usePageTest = (draft: CreatorDraft, page: CreatorPage, locale: LongLocale) => {
  const [running, setRunning] = useState(false);
  const [discord, setDiscord] = useState(false);
  const [discordError, setDiscordError] = useState<DiscordTestError>(null);
  const [state, setState] = useState<PageTestState>({ status: "idle" });
  const startedAt = useRef(Date.now());

  const tick = useCallback(async () => {
    const response = await sendMessage("CREATOR_EXTRACT", { variables: page.variables });

    if (!response.ok) {
      setState({
        status: "error",
        error: response.error
      });
      return;
    }

    const url = new URL(response.extraction.url);
    const preview = buildPreviewActivity(draft, page, response.extraction, locale, {
      nowMs: Date.now(),
      startedAtMs: startedAt.current,
      pageUrl: `${url.origin}${url.pathname}`
    });
    setState({
      status: "ready",
      preview,
      matches: matchesPage(page, url.pathname),
      url: url.href
    });

    if (!discord) return;

    const result = await sendMessage("CREATOR_TEST_ACTIVITY", {
      activity: {
        ...preview.activity,
        largeImageKey: preview.largeImage
      }
    });
    setDiscordError(result.ok ? null : (result.error ?? null));
  }, [draft, page, locale, discord]);

  useEffect(() => {
    if (!running) return;

    void tick();
    const id = window.setInterval(() => void tick(), TICK_MS);
    return () => window.clearInterval(id);
  }, [running, tick]);

  useEffect(() => {
    if (!discord) void sendMessage("CREATOR_TEST_ACTIVITY", { activity: null });
  }, [discord]);

  useEffect(() => () => void sendMessage("CREATOR_TEST_ACTIVITY", { activity: null }), []);

  const toggle = () => {
    if (running) setDiscord(false);
    else startedAt.current = Date.now();
    setRunning(!running);
  };

  return { running, toggle, state, discord, setDiscord, discordError };
};
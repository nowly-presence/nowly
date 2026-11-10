import { EXT_WEB_SOURCE, SEASON_REQUEST } from "@nowly/shared/web-bridge-protocol";
import type { Season } from "@nowly/shared/seasons";
import { applySeasonClass, initialSeasonState, nextSeasonState, parseSeasonMessage, parseSeasonPreview, SEASON_LEAVING_CLASS, SEASON_RESPONSE_TIMEOUT_MS, type SeasonEvent } from "./site-season";

export const startSiteSeason = ({ allowPreview, onChange }: {
  allowPreview: boolean;
  onChange: (season: Season | null) => void;
}): (() => void) => {
  const root = document.documentElement;
  let state = initialSeasonState({ preview: allowPreview ? parseSeasonPreview(window.location.search) : null });
  let timeout: number | null = null;

  const render = () => {
    root.classList.remove(SEASON_LEAVING_CLASS);
    applySeasonClass(root.classList, state.season);
    onChange(state.season);
  };

  const commit = (event: SeasonEvent) => {
    state = nextSeasonState(state, event);
    render();
  };

  const clearResponseTimeout = () => {
    if (timeout !== null) window.clearTimeout(timeout);
    timeout = null;
  };

  const clear = () => {
    clearResponseTimeout();
    commit({ type: "request" });
  };

  const refresh = () => {
    clear();

    if (document.visibilityState !== "visible") return;

    timeout = window.setTimeout(() => {
      timeout = null;
      commit({ type: "timeout" });
    }, SEASON_RESPONSE_TIMEOUT_MS);
    window.postMessage(
      {
        source: EXT_WEB_SOURCE,
        type: SEASON_REQUEST
      },
      window.location.origin
    );
  };

  const onMessage = (event: MessageEvent) => {
    if (event.source !== window || event.origin !== window.location.origin || document.visibilityState !== "visible") return;

    const message = parseSeasonMessage(event.data);

    if (!message) return;

    clearResponseTimeout();
    commit({
      type: "extension",
      season: message.season
    });
  };

  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) refresh();
  };

  const remove = () => {
    clearResponseTimeout();
    applySeasonClass(root.classList, null);
    onChange(null);
  };

  render();

  if (state.source === "preview") return remove;

  window.addEventListener("message", onMessage);
  window.addEventListener("pagehide", clear);
  window.addEventListener("pageshow", onPageShow);
  document.addEventListener("visibilitychange", refresh);
  refresh();

  return () => {
    window.removeEventListener("message", onMessage);
    window.removeEventListener("pagehide", clear);
    window.removeEventListener("pageshow", onPageShow);
    document.removeEventListener("visibilitychange", refresh);
    remove();
  };
};
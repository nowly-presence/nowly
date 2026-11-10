import { EXT_WEB_SOURCE, SEASON_MESSAGE } from "@nowly/shared/web-bridge-protocol";
import { isSeason, SEASONS, type Season } from "@nowly/shared/seasons";

export type SeasonPreview = Season | "none";

export type SeasonSource = "preview" | "pending" | "extension" | "none";

export type SeasonState = {
  season: Season | null;
  source: SeasonSource;
};

export type SeasonEvent = {
  type: "extension";
  season: Season | null;
} | {
  type: "request";
} | {
  type: "timeout";
};

export type SeasonClassList = {
  add: (token: string) => void;
  remove: (token: string) => void;
};

export const SEASON_STORAGE_KEY = "nowly-season";
export const SEASON_PREVIEW_PARAM = "season";
export const SEASON_LEAVING_CLASS = "season-leaving";
export const SEASON_RESPONSE_TIMEOUT_MS = 4000;

const SEASON_CLASS_PREFIX = "season-";

export const seasonClassName = (season: Season): string => `${SEASON_CLASS_PREFIX}${season}`;

export const parseSeasonMessage = (data: unknown): {
  season: Season | null;
} | null => {
  if (!data || typeof data !== "object") return null;

  const message = data as {
    source?: unknown;
    type?: unknown;
    payload?: unknown;
  };

  if (message.source !== EXT_WEB_SOURCE || message.type !== SEASON_MESSAGE) return null;
  if (!message.payload || typeof message.payload !== "object") return null;

  const { season } = message.payload as {
    season?: unknown;
  };

  if (season === null || isSeason(season)) return { season };

  return typeof season === "string" ? { season: null } : null;
};

export const parseSeasonPreview = (search: string): SeasonPreview | null => {
  const value = new URLSearchParams(search).get(SEASON_PREVIEW_PARAM);
  return value === "none" || isSeason(value) ? value : null;
};

export const initialSeasonState = ({ preview }: {
  preview: SeasonPreview | null;
}): SeasonState => {
  if (preview) return {
    season: preview === "none" ? null : preview,
    source: "preview"
  };

  return {
    season: null,
    source: "none"
  };
};

export const nextSeasonState = (state: SeasonState, event: SeasonEvent): SeasonState => {
  if (state.source === "preview") return state;
  if (event.type === "request") return {
    season: null,
    source: "pending"
  };
  if (event.type === "extension") return {
    season: event.season,
    source: "extension"
  };

  return state.source === "extension" ? state : { season: null, source: "none" };
};

export const applySeasonClass = (classList: SeasonClassList, season: Season | null): void => {
  for (const known of SEASONS) {
    if (known === season) classList.add(seasonClassName(known));
    else classList.remove(seasonClassName(known));
  }
};

export const seasonBootScript = (allowPreview: boolean): string => {
  const seasons = JSON.stringify(SEASONS);
  const preview = allowPreview
    ? `const q=new URLSearchParams(location.search).get(${JSON.stringify(SEASON_PREVIEW_PARAM)});if(s.includes(q))r.classList.add(${JSON.stringify(SEASON_CLASS_PREFIX)}+q);`
    : "";
  return `(()=>{const r=document.documentElement,s=${seasons};r.classList.remove(${JSON.stringify(SEASON_LEAVING_CLASS)},...s.map(v=>${JSON.stringify(SEASON_CLASS_PREFIX)}+v));${preview}try{localStorage.removeItem(${JSON.stringify(SEASON_STORAGE_KEY)})}catch{}})()`;
};
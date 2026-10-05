export const SITE_SEASONS = ["spring", "summer", "autumn", "winter", "halloween", "new-year"] as const;

export type SiteSeason = (typeof SITE_SEASONS)[number];

export type SeasonPreview = SiteSeason | "none";

export type SeasonSource = "preview" | "stored" | "extension" | "none";

export type SeasonState = { season: SiteSeason | null; source: SeasonSource };

export type SeasonEvent = { type: "extension"; season: SiteSeason | null } | { type: "timeout" };

export type SeasonClassList = { add: (token: string) => void; remove: (token: string) => void };

export const EXT_SOURCE = "Nowly";
export const SEASON_MESSAGE = "SEASON";
export const SEASON_REQUEST = "GET_SEASON";
export const SEASON_STORAGE_KEY = "nowly-season";
export const SEASON_PREVIEW_PARAM = "season";
export const SEASON_LEAVING_CLASS = "season-leaving";
export const SEASON_RESPONSE_TIMEOUT_MS = 4000;
export const SEASON_FADE_MS = 700;

export const isSiteSeason = (value: unknown): value is SiteSeason => SITE_SEASONS.some((season) => season === value);

export const seasonClassName = (season: SiteSeason): string => `season-${season}`;

export const parseSeasonMessage = (data: unknown): { season: SiteSeason | null } | null => {
  if (!data || typeof data !== "object") return null;
  const message = data as { source?: unknown; type?: unknown; payload?: unknown };
  if (message.source !== EXT_SOURCE || message.type !== SEASON_MESSAGE) return null;
  if (!message.payload || typeof message.payload !== "object") return null;
  const { season } = message.payload as { season?: unknown };
  if (season === null || isSiteSeason(season)) return { season };
  return typeof season === "string" ? { season: null } : null;
};

export const parseSeasonPreview = (search: string): SeasonPreview | null => {
  const value = new URLSearchParams(search).get(SEASON_PREVIEW_PARAM);
  return value === "none" || isSiteSeason(value) ? value : null;
};

export const readStoredSeason = (value: string | null): SiteSeason | null => (isSiteSeason(value) ? value : null);

export const initialSeasonState = ({ stored, preview }: { stored: SiteSeason | null; preview: SeasonPreview | null }): SeasonState => {
  if (preview) return { season: preview === "none" ? null : preview, source: "preview" };
  return stored ? { season: stored, source: "stored" } : { season: null, source: "none" };
};

export const nextSeasonState = (state: SeasonState, event: SeasonEvent): SeasonState => {
  if (state.source === "preview") return state;
  if (event.type === "extension") return { season: event.season, source: "extension" };
  return state.source === "extension" ? state : { season: null, source: "none" };
};

export const seasonToStore = (state: SeasonState): SiteSeason | null | undefined => {
  if (state.source === "preview" || state.source === "stored") return undefined;
  return state.season;
};

export const applySeasonClass = (classList: SeasonClassList, season: SiteSeason | null): void => {
  for (const known of SITE_SEASONS) {
    if (known === season) classList.add(seasonClassName(known));
    else classList.remove(seasonClassName(known));
  }
};

export const seasonBootScript = (allowPreview: boolean): string => {
  const seasons = JSON.stringify(SITE_SEASONS);
  const preview = allowPreview
    ? `const q=new URLSearchParams(location.search).get(${JSON.stringify(SEASON_PREVIEW_PARAM)});if(q==="none")return;if(s.includes(q))v=q;`
    : "";
  return `(()=>{try{const s=${seasons};let v=null;${preview}if(!v)v=localStorage.getItem(${JSON.stringify(SEASON_STORAGE_KEY)});if(s.includes(v))document.documentElement.classList.add("season-"+v)}catch{}})()`;
};

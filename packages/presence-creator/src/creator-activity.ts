import type { LocaleString as LongLocale } from "@nowly/locales";
import { textIn } from "./creator-draft";
import type { CreatorActivityType, CreatorButton, CreatorDraft, CreatorExtraction, CreatorMediaState, CreatorPage, CreatorVariable } from "./creator-types";

const TOKEN = /\{([a-zA-Z][a-zA-Z0-9]*)\}/g;
const SECOND_MS = 1000;

export const ACTIVITY_TYPE_VALUES: Record<CreatorActivityType, number> = {
  playing: 0,
  listening: 2,
  watching: 3,
  competing: 5
};

export const templateTokens = (template: string): string[] => [...template.matchAll(TOKEN)].map((match) => match[1]);

export const fillTemplate = (template: string, values: Record<string, string | undefined>): string =>
  template
    .replace(TOKEN, (_, name: string) => values[name] ?? "")
    .replace(/\s+/g, " ")
    .trim();

const normalizePath = (path: string): string => {
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, "") : withSlash;
};

export const matchesPage = (page: CreatorPage, pathname: string): boolean => {
  const { mode, path } = page.match;

  if (mode === "any" || !path.trim()) return true;

  const current = normalizePath(pathname);
  const target = normalizePath(path.trim());

  if (mode === "equals") return current === target;
  if (mode === "startsWith") return current.startsWith(target);

  return current.includes(path.trim());
};

export const findPage = (pages: CreatorPage[], url: string): CreatorPage | undefined => {
  const pathname = URL.canParse(url) ? new URL(url).pathname : "/";
  return pages.find((page) => matchesPage(page, pathname));
};

export const missingVariables = (template: string, variables: CreatorVariable[]): string[] => {
  const known = new Set(variables.map((variable) => variable.name));
  return templateTokens(template).filter((name) => !known.has(name));
};

export const mediaTimestamps = (media: CreatorMediaState | undefined, nowMs: number): {
  startTimestamp?: number;
  endTimestamp?: number;
} => {
  if (!media || media.paused) return {};

  const now = Math.floor(nowMs / SECOND_MS);
  return {
    startTimestamp: now - Math.floor(media.currentTime),
    endTimestamp: Number.isFinite(media.duration) ? now + Math.floor(media.duration - media.currentTime) : undefined
  };
};

const variableById = (page: CreatorPage, id: string): CreatorVariable | undefined => page.variables.find((variable) => variable.id === id);

export const imageVariableOf = (page: CreatorPage): CreatorVariable | undefined => {
  const image = page.largeImage;
  return image.kind === "variable" ? variableById(page, image.variableId) : undefined;
};

export const linkVariableOf = (page: CreatorPage, button: CreatorButton): CreatorVariable | undefined => {
  const link = button.link;
  return link.kind === "variable" ? variableById(page, link.variableId) : undefined;
};

export const isImageVariable = (variable: CreatorVariable): boolean =>
  variable.source.kind === "element" ? variable.source.read === "image" : variable.source.kind === "meta" && variable.source.property === "og:image";

export const isLinkVariable = (variable: CreatorVariable): boolean => variable.source.kind === "element" && variable.source.read === "link";

export const isUrlTemplate = (template: string): boolean => /^https:\/\/[^\s{}]+/.test(template.trim());

export const fillUrl = (template: string, values: Record<string, string | undefined>): string | undefined => {
  if (templateTokens(template).some((name) => !values[name])) return undefined;

  const url = template.trim().replace(TOKEN, (_, name: string) => values[name] ?? "");
  return url.startsWith("https://") && URL.canParse(url) ? url : undefined;
};

const httpsOnly = (value: string | undefined): string | undefined => (value?.startsWith("https://") ? value : undefined);

const previewImage = (page: CreatorPage, values: Record<string, string | undefined>): string | undefined => {
  const image = page.largeImage;

  if (image.kind === "custom") return fillUrl(image.template, values);

  const variable = imageVariableOf(page);
  return variable ? httpsOnly(values[variable.name]) : undefined;
};

const previewLink = (page: CreatorPage, button: CreatorButton, values: Record<string, string | undefined>, pageUrl: string): string | undefined => {
  const link = button.link;

  if (link.kind === "custom") return fillUrl(link.template, values);
  if (link.kind === "variable") {
    const variable = linkVariableOf(page, button);
    return variable ? values[variable.name] : undefined;
  }

  return pageUrl;
};

export const valuesByName = (page: CreatorPage, extraction: CreatorExtraction): Record<string, string | undefined> =>
  Object.fromEntries(page.variables.map((variable) => [variable.name, extraction.values.find((entry) => entry.variableId === variable.id)?.value]));

export type CreatorPreviewActivity = {
  name: string;
  details?: string;
  state?: string;
  largeImageText: string;
  type: number;
  startTimestamp?: number;
  endTimestamp?: number;
  buttons?: {
    label: string;
    url: string;
  }[];
};

export type CreatorPreview = {
  activity: CreatorPreviewActivity;
  largeImage?: string;
  missing: string[];
};

export const buildPreviewActivity = (draft: CreatorDraft, page: CreatorPage, extraction: CreatorExtraction, locale: LongLocale, options: {
  nowMs: number;
  startedAtMs: number;
  pageUrl: string;
}): CreatorPreview => {
  const values = valuesByName(page, extraction);
  const read = (template: string) => fillTemplate(template, values);
  const missing = page.variables.filter((variable) => !values[variable.name]).map((variable) => variable.name);

  const details = read(textIn(page.details, locale));
  const state = read(textIn(page.state, locale));
  const timestamps =
    page.timestamps === "media" ? mediaTimestamps(extraction.media, options.nowMs) : { startTimestamp: Math.floor(options.startedAtMs / SECOND_MS) };
  const buttons = page.buttons.flatMap((button) => {
    const label = read(textIn(button.label, locale));
    const url = previewLink(page, button, values, options.pageUrl);
    return label && url ? [{ label, url }] : [];
  });
  return {
    activity: {
      name: draft.name,
      details: details || undefined,
      state: state || undefined,
      largeImageText: draft.name,
      type: ACTIVITY_TYPE_VALUES[page.activityType],
      ...timestamps,
      buttons: buttons.length > 0 ? buttons : undefined
    },
    largeImage: previewImage(page, values),
    missing
  };
};
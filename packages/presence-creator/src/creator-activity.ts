import type { LocaleString as LongLocale } from "@nowly/locales";
import { firedActions } from "./creator-conditions";
import { textIn } from "./creator-draft";
import type { CreatorActivityType, CreatorButton, CreatorConditionAction, CreatorDraft, CreatorExtraction, CreatorImage, CreatorLink, CreatorMediaState, CreatorPage, CreatorSmallImage, CreatorTimestamps, CreatorVariable, LocalizedText } from "./creator-types";

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

export const withLeadingSlash = (path: string): string => (path.startsWith("/") ? path : `/${path}`);

export const withoutTrailingSlash = (path: string): string => path.replace(/\/+$/, "") || "/";

export const matchPaths = (page: CreatorPage): string[] =>
  page.match.mode === "any" ? [] : [page.match.path, ...(page.match.extraPaths ?? [])].map((path) => path.trim()).filter(Boolean);

export const matchesPath = (mode: CreatorPage["match"]["mode"], path: string, pathname: string): boolean => {
  if (mode === "equals") return withoutTrailingSlash(pathname) === withoutTrailingSlash(withLeadingSlash(path));
  if (mode === "startsWith") return pathname.startsWith(withLeadingSlash(path));

  return pathname.includes(path);
};

export const matchesPage = (page: CreatorPage, pathname: string): boolean => {
  const paths = matchPaths(page);
  return paths.length === 0 || paths.some((path) => matchesPath(page.match.mode, path, pathname));
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
  smallImage?: string;
  hidden: boolean;
  missing: string[];
};

type PreviewState = {
  name?: string;
  details: string;
  state: string;
  largeImage?: string;
  largeImageText: string;
  smallImage?: string;
  type: CreatorActivityType;
  timestamps: CreatorTimestamps;
  buttons: {
    id: string;
    label: string;
    url?: string;
    hidden: boolean;
  }[];
};

type ActionContext = {
  page: CreatorPage;
  values: Record<string, string | undefined>;
  read: (text: LocalizedText) => string;
  pageUrl: string;
};

const overrideImage = (context: ActionContext, image: CreatorImage | CreatorSmallImage, fallback: string | undefined): string | undefined => {
  if (image.kind === "custom") return fillUrl(image.template, context.values) ?? fallback;
  if (image.kind === "variable") {
    const variable = variableById(context.page, image.variableId);
    return httpsOnly(variable ? context.values[variable.name] : undefined) ?? fallback;
  }

  return undefined;
};

const overrideLink = (context: ActionContext, link: CreatorLink, fallback: string | undefined): string | undefined => {
  if (link.kind === "custom") return fillUrl(link.template, context.values) ?? fallback;
  if (link.kind === "variable") {
    const variable = variableById(context.page, link.variableId);
    return (variable ? context.values[variable.name] : undefined) || fallback;
  }

  return context.pageUrl;
};

const applyAction = (state: PreviewState, action: CreatorConditionAction, context: ActionContext): PreviewState => {
  const updateButton = (id: string, change: (button: PreviewState["buttons"][number]) => PreviewState["buttons"][number]) => ({
    ...state,
    buttons: state.buttons.map((button) => (button.id === id ? change(button) : button))
  });

  switch (action.kind) {
    case "details":
      return {
        ...state,
        details: context.read(action.text)
      };
    case "state":
      return {
        ...state,
        state: context.read(action.text)
      };
    case "activityName":
      return {
        ...state,
        name: context.read(action.text)
      };
    case "imageText":
      return {
        ...state,
        largeImageText: context.read(action.text)
      };
    case "largeImage":
      return {
        ...state,
        largeImage: overrideImage(context, action.image, state.largeImage)
      };
    case "smallImage":
      return {
        ...state,
        smallImage: overrideImage(context, action.image, state.smallImage)
      };
    case "activityType":
      return {
        ...state,
        type: action.activityType
      };
    case "timestamps":
      return {
        ...state,
        timestamps: action.timestamps
      };
    case "hideButton":
      return updateButton(action.buttonId, (button) => ({
        ...button,
        hidden: true
      }));
    case "buttonLabel":
      return updateButton(action.buttonId, (button) => ({
        ...button,
        label: context.read(action.text)
      }));
    case "buttonLink":
      return updateButton(action.buttonId, (button) => ({
        ...button,
        url: overrideLink(context, action.link, button.url)
      }));
    case "hidePresence":
      return state;
  }
};

export const buildPreviewActivity = (draft: CreatorDraft, page: CreatorPage, extraction: CreatorExtraction, locale: LongLocale, options: {
  nowMs: number;
  startedAtMs: number;
  pageUrl: string;
}): CreatorPreview => {
  const values = valuesByName(page, extraction);
  const read = (text: LocalizedText) => fillTemplate(textIn(text, locale), values);
  const missing = page.variables.filter((variable) => !values[variable.name]).map((variable) => variable.name);

  const actions = firedActions(page, values);
  const context: ActionContext = {
    page,
    values,
    read,
    pageUrl: options.pageUrl
  };

  const base: PreviewState = {
    details: read(page.details),
    state: read(page.state),
    largeImage: previewImage(page, values),
    largeImageText: draft.name,
    type: page.activityType,
    timestamps: page.timestamps,
    buttons: page.buttons.map((button) => ({
      id: button.id,
      label: read(button.label),
      url: previewLink(page, button, values, options.pageUrl),
      hidden: false
    }))
  };
  const result = actions.reduce((state, action) => applyAction(state, action, context), base);

  const timestamps =
    result.timestamps === "media" ? mediaTimestamps(extraction.media, options.nowMs) : { startTimestamp: Math.floor(options.startedAtMs / SECOND_MS) };
  const buttons = result.buttons.flatMap((button) =>
    !button.hidden && button.label && button.url
      ? [
          {
            label: button.label,
            url: button.url
          }
        ]
      : []
  );
  return {
    activity: {
      name: result.name || draft.name,
      details: result.details || undefined,
      state: result.state || undefined,
      largeImageText: result.largeImageText,
      type: ACTIVITY_TYPE_VALUES[result.type],
      ...timestamps,
      buttons: buttons.length > 0 ? buttons : undefined
    },
    largeImage: result.largeImage,
    smallImage: result.smallImage,
    hidden: actions.some((action) => action.kind === "hidePresence"),
    missing
  };
};
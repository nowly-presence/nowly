import type { CreatorExtraction, CreatorMediaState, CreatorSource, CreatorVariable } from "@nowly/presence-creator/creator-types";

const TEXT_MAX_LENGTH = 200;

const cleanText = (value: string | null | undefined): string | undefined => value?.replace(/\s+/g, " ").trim().slice(0, TEXT_MAX_LENGTH) || undefined;

const httpsOnly = (value: string | null | undefined): string | undefined => (value?.startsWith("https://") ? value : undefined);

export const readElementImage = (element: Element | null): string | undefined => {
  if (!element) return undefined;
  if (element instanceof HTMLImageElement) return httpsOnly(element.currentSrc || element.src);

  return httpsOnly(element.getAttribute("src"));
};

export const readElementLink = (element: Element | null): string | undefined => (element instanceof HTMLAnchorElement ? element.href : undefined);

export const resolveSource = (source: CreatorSource, doc: Document): string | undefined => {
  if (source.kind === "tabTitle") return cleanText(doc.title);
  if (source.kind === "meta") return cleanText(doc.querySelector<HTMLMetaElement>(`meta[property="${source.property}"]`)?.content);

  const element = safeQuery(doc, source.selector);

  if (source.read === "image") return readElementImage(element);
  if (source.read === "link") return readElementLink(element);

  return cleanText(element?.textContent);
};

export const safeQuery = (doc: Document | Element, selector: string): Element | null => {
  try {
    return doc.querySelector(selector);
  } catch {
    return null;
  }
};

export const readMediaState = (doc: Document): CreatorMediaState | undefined => {
  const media = doc.querySelector<HTMLMediaElement>("video, audio");
  return media ? { currentTime: media.currentTime, duration: media.duration, paused: media.paused } : undefined;
};

export const extractVariables = (variables: CreatorVariable[], doc: Document, url: string): CreatorExtraction => ({
  url,
  values: variables.map((variable) => ({
    variableId: variable.id,
    value: resolveSource(variable.source, doc)
  })),
  media: readMediaState(doc)
});
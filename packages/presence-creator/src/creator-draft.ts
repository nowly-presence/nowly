import type { LocaleString as LongLocale } from "@nowly/locales";
import type { CreatorButton, CreatorDraft, CreatorLink, CreatorPage, CreatorSource, CreatorVariable, LocalizedText } from "./creator-types";

export const CREATOR_DEFAULT_COLOR = "#0891b2";
const IDENTIFIER_MAX_LENGTH = 32;
export const FEATURES_MAX = 5;
export const FEATURE_MAX_LENGTH = 80;
export const BUTTONS_MAX = 2;

export const creatorId = (): string => crypto.randomUUID().slice(0, 8);

export const createDraft = (baseLocale: LongLocale, domain?: string, now = Date.now()): CreatorDraft => ({
  id: creatorId(),
  createdAt: now,
  updatedAt: now,
  step: "visuals",
  assets: { thumbnailRightsConfirmed: false },
  name: "",
  domains: domain ? [domain] : [],
  color: CREATOR_DEFAULT_COLOR,
  category: "other",
  baseLocale,
  translationMode: "auto",
  locales: [baseLocale],
  description: {},
  longDescription: {},
  features: [{}],
  pages: [],
  browsingFallback: false,
  author: { name: "" }
});

export const createPage = (name: string, path = ""): CreatorPage => ({
  id: creatorId(),
  name,
  match: {
    mode: "startsWith",
    path
  },
  activityType: "watching",
  variables: [],
  details: {},
  state: {},
  largeImage: { kind: "logo" },
  timestamps: "elapsed",
  buttons: []
});

export const createButton = (): CreatorButton => ({
  id: creatorId(),
  label: {},
  link: { kind: "page" }
});

type LegacyButton = {
  enabled?: boolean;
  label?: LocalizedText;
  link?: CreatorLink;
};

const upgradeButtons = (buttons: CreatorButton[] | undefined, legacy: LegacyButton | undefined): CreatorButton[] => {
  if (Array.isArray(buttons)) {
    return buttons.slice(0, BUTTONS_MAX).map((button) => ({
      ...button,
      link: button.link ?? { kind: "page" }
    }));
  }

  return legacy?.enabled
    ? [
        {
          id: creatorId(),
          label: legacy.label ?? {},
          link: legacy.link ?? { kind: "page" }
        }
      ]
    : [];
};

const normalizePage = (page: CreatorPage & {
  button?: LegacyButton;
}): CreatorPage => {
  const { button, ...rest } = page;
  return {
    ...rest,
    timestamps: page.timestamps === "media" ? "media" : "elapsed",
    buttons: upgradeButtons(page.buttons, button)
  };
};

export const normalizeDraft = (draft: CreatorDraft): CreatorDraft => ({
  ...draft,
  features: draft.features.slice(0, FEATURES_MAX),
  pages: draft.pages.map(normalizePage)
});

export const toIdentifier = (value: string): string => {
  const words = value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  if (words.length === 0) return "";

  const camel = words
    .map((word) => (word === word.toUpperCase() ? word.toLowerCase() : word))
    .map((word, index) => (index === 0 ? word[0].toLowerCase() : word[0].toUpperCase()) + word.slice(1))
    .join("");
  const safe = /^[a-z]/.test(camel) ? camel : `v${camel}`;
  return safe.slice(0, IDENTIFIER_MAX_LENGTH);
};

export const createVariable = (name: string, source: CreatorSource, sample?: string): CreatorVariable => ({
  id: creatorId(),
  name: toIdentifier(name),
  source,
  sample
});

export const presenceSlug = (name: string): string => name.trim().toLowerCase().replace(/\s+/g, "-");

export const presenceFolder = (name: string): string => {
  const trimmed = name.trim();
  return `src/${trimmed.charAt(0).toUpperCase()}/${trimmed}`;
};

export const isValidPresenceName = (name: string): boolean => /^[\p{L}\p{N}][\p{L}\p{N} .+!&'-]{0,39}$/u.test(name.trim());

export const normalizeDomain = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "")
    .replace(/^www\./, "");

export const isValidDomain = (value: string): boolean => /^([a-z0-9-]+\.)+[a-z]{2,}$/.test(value);

export const textIn = (text: LocalizedText, locale: LongLocale): string => text[locale]?.trim() ?? "";

export const pageKey = (page: CreatorPage, index: number): string => toIdentifier(page.name) || `page${index + 1}`;

export const touch = (draft: CreatorDraft, now = Date.now()): CreatorDraft => ({
  ...draft,
  updatedAt: now
});

export const addVariable = (page: CreatorPage, variable: CreatorVariable): {
  page: CreatorPage;
  variable: CreatorVariable;
} => {
  const taken = new Set(page.variables.map((entry) => entry.name));
  const base = variable.name || "value";
  let name = base;

  for (let index = 2; taken.has(name); index++) name = `${base}${index}`;

  const added = { ...variable, name };
  return {
    page: {
      ...page,
      variables: [...page.variables, added]
    },
    variable: added
  };
};

export const removeVariable = (page: CreatorPage, id: string): CreatorPage => ({
  ...page,
  variables: page.variables.filter((variable) => variable.id !== id),
  largeImage: page.largeImage.kind === "variable" && page.largeImage.variableId === id ? { kind: "logo" } : page.largeImage,
  buttons: page.buttons.map((button) => (button.link.kind === "variable" && button.link.variableId === id ? { ...button, link: { kind: "page" } } : button))
});
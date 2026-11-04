import { creatorId, normalizeDraft } from "@nowly/presence-creator/creator-draft";
import { CREATOR_STEPS, type CreatorDraft } from "@nowly/presence-creator/creator-types";

export const CREATOR_DRAFT_FILE_FORMAT = "nowly.presence-draft";
export const CREATOR_DRAFT_FILE_VERSION = 1;
export const CREATOR_DRAFT_FILE_MAX_BYTES = 8 * 1024 * 1024;
export const CREATOR_DRAFT_FILE_FALLBACK_NAME = "presence";

const IMAGE_DATA_URL = /^data:image\/(png|jpeg|webp);base64,/;
const NON_FILE_NAME_CHARS = /[^a-z0-9]+/g;
const EDGE_DASHES = /^-+|-+$/g;
const FILE_NAME_MAX_LENGTH = 60;

export type DraftFileError = "TOO_LARGE" | "INVALID_JSON" | "WRONG_FORMAT" | "UNSUPPORTED_VERSION" | "INVALID_DRAFT";

export type ParseDraftFileResult = {
  ok: true;
  draft: CreatorDraft;
} | {
  ok: false;
  error: DraftFileError;
};

type Dict = Record<string, unknown>;

const isDict = (value: unknown): value is Dict => typeof value === "object" && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === "string");

const isOptionalImage = (value: unknown): boolean => value === undefined || (typeof value === "string" && IMAGE_DATA_URL.test(value));

const hasDraftShape = (value: Dict): boolean =>
  typeof value.name === "string" &&
  typeof value.color === "string" &&
  typeof value.baseLocale === "string" &&
  typeof value.translationMode === "string" &&
  typeof value.browsingFallback === "boolean" &&
  CREATOR_STEPS.some((step) => step === value.step) &&
  isStringArray(value.domains) &&
  isStringArray(value.locales) &&
  isDict(value.description) &&
  isDict(value.longDescription) &&
  Array.isArray(value.features) &&
  value.features.every(isDict) &&
  Array.isArray(value.pages) &&
  value.pages.every(isDict) &&
  isDict(value.author) &&
  typeof value.author.name === "string" &&
  isDict(value.assets) &&
  isOptionalImage(value.assets.thumbnail) &&
  isOptionalImage(value.assets.logo) &&
  isOptionalImage(value.assets.icon);

export const creatorDraftFileName = (name: string): string => {
  const slug = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(NON_FILE_NAME_CHARS, "-")
    .replace(EDGE_DASHES, "")
    .slice(0, FILE_NAME_MAX_LENGTH);
  return `${slug || CREATOR_DRAFT_FILE_FALLBACK_NAME}-draft.json`;
};

export const buildCreatorDraftFile = (draft: CreatorDraft, now = new Date()) => {
  const { submission: _submission, sentSignature: _signature, ...content } = draft;
  return {
    format: CREATOR_DRAFT_FILE_FORMAT,
    version: CREATOR_DRAFT_FILE_VERSION,
    exportedAt: now.toISOString(),
    draft: content
  };
};

export const parseCreatorDraftFile = (text: string, now = Date.now()): ParseDraftFileResult => {
  if (text.length > CREATOR_DRAFT_FILE_MAX_BYTES) return {
    ok: false,
    error: "TOO_LARGE"
  };

  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: "INVALID_JSON"
    };
  }

  if (!isDict(parsed) || parsed.format !== CREATOR_DRAFT_FILE_FORMAT) return {
    ok: false,
    error: "WRONG_FORMAT"
  };
  if (parsed.version !== CREATOR_DRAFT_FILE_VERSION) return {
    ok: false,
    error: "UNSUPPORTED_VERSION"
  };
  if (!isDict(parsed.draft) || !hasDraftShape(parsed.draft)) return {
    ok: false,
    error: "INVALID_DRAFT"
  };

  const { submission: _ignored, sentSignature: _ignoredSignature, ...content } = parsed.draft;
  const draft = normalizeDraft({
    ...(content as Omit<CreatorDraft, "id" | "createdAt" | "updatedAt">),
    id: creatorId(),
    createdAt: now,
    updatedAt: now
  });
  return {
    ok: true,
    draft
  };
};
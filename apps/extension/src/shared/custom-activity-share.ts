import { CUSTOM_ACTIVITY_TYPES, CUSTOM_BUTTONS_MAX, hasCustomActivityErrors, isCustomActivityIcon, validateCustomActivity } from "@/shared/custom-activity";
import { decodeImageDataUrl } from "@/shared/custom-image";
import type { CustomActivity, CustomActivityDraft, CustomActivityType, CustomImage, CustomTimestamp } from "@/shared/types";

export const CUSTOM_ACTIVITY_FILE_FORMAT = "nowly.custom-activity";
export const CUSTOM_ACTIVITY_FILE_VERSION = 1;
export const CUSTOM_ACTIVITY_FILE_MAX_BYTES = 4 * 1024 * 1024;
export const CUSTOM_ACTIVITY_FILE_NAME_MAX_LENGTH = 80;
export const CUSTOM_ACTIVITY_FILE_EXTENSION = ".json";
export const CUSTOM_ACTIVITY_FILE_FALLBACK_NAME = "activity";

export type SharedImage = {
  kind: "none";
} | {
  kind: "url";
  url: string;
} | {
  kind: "icon";
  icon: string;
  color: string;
} | {
  kind: "embedded";
  dataUrl: string;
};

export type SharedActivityFile = {
  format: typeof CUSTOM_ACTIVITY_FILE_FORMAT;
  version: typeof CUSTOM_ACTIVITY_FILE_VERSION;
  exportedAt: string;
  activity: {
    name: string;
    type: CustomActivityType;
    details: string;
    state: string;
    largeImage: SharedImage;
    largeText: string;
    smallImage: SharedImage;
    smallText: string;
    timestamp: CustomTimestamp;
    buttons: {
      label: string;
      url: string;
    }[];
  };
};

export type ImportedImages = {
  largeImage?: string;
  smallImage?: string;
};
export type ParsedActivityFile = {
  draft: CustomActivityDraft;
  images: ImportedImages;
};
export type ActivityFileError = "TOO_LARGE" | "INVALID_JSON" | "WRONG_FORMAT" | "UNSUPPORTED_VERSION" | "INVALID_ACTIVITY";
export type ParseActivityFileResult =
  | ({
      ok: true;
    } & ParsedActivityFile)
  | {
      ok: false;
      error: ActivityFileError;
    };

type Dict = Record<string, unknown>;

const isDict = (value: unknown): value is Dict => typeof value === "object" && value !== null && !Array.isArray(value);

const asString = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const isActivityType = (value: unknown): value is CustomActivityType => CUSTOM_ACTIVITY_TYPES.some((type) => type === value);

const ILLEGAL_FILE_NAME_CHARS = /[\\/:*?"<>|\u0000-\u001f]/g;
const TRAILING_DOTS_AND_SPACES = /[. ]+$/;
const WHITESPACE_RUN = /\s+/g;

export const activityFileName = (name: string): string => {
  const cleaned = name
    .replace(ILLEGAL_FILE_NAME_CHARS, " ")
    .replace(WHITESPACE_RUN, " ")
    .trim()
    .slice(0, CUSTOM_ACTIVITY_FILE_NAME_MAX_LENGTH)
    .replace(TRAILING_DOTS_AND_SPACES, "");
  return `${cleaned || CUSTOM_ACTIVITY_FILE_FALLBACK_NAME}${CUSTOM_ACTIVITY_FILE_EXTENSION}`;
};

const exportImage = (image: CustomImage, imageData: Record<string, string>): SharedImage => {
  if (image.kind === "upload") {
    const dataUrl = imageData[image.hash];
    return dataUrl ? { kind: "embedded", dataUrl } : { kind: "none" };
  }

  return image;
};

export const buildActivityFile = (activity: CustomActivity, imageData: Record<string, string>, exportedAt: Date = new Date()): SharedActivityFile => ({
  format: CUSTOM_ACTIVITY_FILE_FORMAT,
  version: CUSTOM_ACTIVITY_FILE_VERSION,
  exportedAt: exportedAt.toISOString(),
  activity: {
    name: activity.name,
    type: activity.type,
    details: activity.details,
    state: activity.state,
    largeImage: exportImage(activity.largeImage, imageData),
    largeText: activity.largeText,
    smallImage: exportImage(activity.smallImage, imageData),
    smallText: activity.smallText,
    timestamp: activity.timestamp,
    buttons: activity.buttons.map((button) => ({
      label: button.label,
      url: button.url
    }))
  }
});

export const serializeActivityFile = (file: SharedActivityFile): string => JSON.stringify(file, null, 2);

type ImageParse = {
  ok: true;
  image: CustomImage;
  embedded?: string;
} | {
  ok: false;
};

const parseImage = (value: unknown): ImageParse => {
  if (value === undefined) return {
    ok: true,
    image: { kind: "none" }
  };
  if (!isDict(value)) return {
    ok: false
  };
  if (value.kind === "none") return {
    ok: true,
    image: { kind: "none" }
  };
  if (value.kind === "url") return {
    ok: true,
    image: {
      kind: "url",
      url: asString(value.url)
    }
  };
  if (value.kind === "icon") {
    const icon = asString(value.icon);
    return isCustomActivityIcon(icon)
      ? {
          ok: true,
          image: {
            kind: "icon",
            icon,
            color: asString(value.color)
          }
        }
      : { ok: false };
  }

  if (value.kind === "embedded") {
    const dataUrl = typeof value.dataUrl === "string" ? value.dataUrl.trim() : "";

    try {
      const decoded = decodeImageDataUrl(dataUrl);
      return decoded.ok ? { ok: true, image: { kind: "none" }, embedded: dataUrl } : { ok: false };
    } catch {
      return {
        ok: false
      };
    }
  }

  return {
    ok: false
  };
};

const parseTimestamp = (value: unknown): CustomTimestamp | null => {
  if (value === undefined) return {
    mode: "elapsed"
  };
  if (!isDict(value)) return null;
  if (value.mode === "elapsed") return {
    mode: "elapsed"
  };
  if (value.mode === "countdown" && typeof value.minutes === "number") return {
    mode: "countdown",
    minutes: value.minutes
  };

  return null;
};

const parseButtons = (value: unknown): CustomActivityDraft["buttons"] | null => {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > CUSTOM_BUTTONS_MAX) return null;

  const buttons = value.map((item) => (isDict(item) ? { label: asString(item.label), url: asString(item.url) } : null));
  return buttons.every((button) => button !== null) ? buttons.filter((button) => button !== null) : null;
};

const parseActivity = (value: unknown): ParsedActivityFile | null => {
  if (!isDict(value) || !isActivityType(value.type)) return null;

  const large = parseImage(value.largeImage);
  const small = parseImage(value.smallImage);
  const timestamp = parseTimestamp(value.timestamp);
  const buttons = parseButtons(value.buttons);

  if (!large.ok || !small.ok || !timestamp || !buttons) return null;

  const draft: CustomActivityDraft = {
    name: asString(value.name),
    type: value.type,
    details: asString(value.details),
    state: asString(value.state),
    largeImage: large.image,
    largeText: asString(value.largeText),
    smallImage: small.image,
    smallText: asString(value.smallText),
    timestamp,
    buttons
  };

  if (hasCustomActivityErrors(validateCustomActivity(draft))) return null;

  return {
    draft,
    images: {
      largeImage: large.embedded,
      smallImage: small.embedded
    }
  };
};

export const parseActivityFile = (text: string): ParseActivityFileResult => {
  if (new TextEncoder().encode(text).byteLength > CUSTOM_ACTIVITY_FILE_MAX_BYTES) return {
    ok: false,
    error: "TOO_LARGE"
  };

  let raw: unknown;

  try {
    raw = JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: "INVALID_JSON"
    };
  }

  if (!isDict(raw) || raw.format !== CUSTOM_ACTIVITY_FILE_FORMAT) return {
    ok: false,
    error: "WRONG_FORMAT"
  };
  if (raw.version !== CUSTOM_ACTIVITY_FILE_VERSION) return {
    ok: false,
    error: "UNSUPPORTED_VERSION"
  };

  const parsed = parseActivity(raw.activity);
  return parsed ? { ok: true, ...parsed } : { ok: false, error: "INVALID_ACTIVITY" };
};
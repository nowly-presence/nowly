import { SUPPORTED_LOCALES } from "@nowly/locales";
import { z } from "zod";
import { BUTTONS_MAX, FEATURE_MAX_LENGTH, FEATURES_MAX, PRESENCE_NAME_MAX_LENGTH } from "./creator-draft";
import { CREATOR_STEPS, type CreatorDraft } from "./creator-types";
import { DESCRIPTION_MAX_LENGTH, LONG_DESCRIPTION_MAX_LENGTH } from "./creator-validation";

export const CREATOR_ID_PATTERN = /^[A-Za-z0-9]{8}$/;
export const PAGES_MAX = 20;
export const VARIABLES_PER_PAGE_MAX = 12;
export const PAGE_NAME_MAX_LENGTH = 40;
export const SELECTOR_MAX_LENGTH = 300;
export const TEMPLATE_MAX_LENGTH = 256;
export const PAGE_TEXT_MAX_LENGTH = 128;
export const BUTTON_LABEL_MAX_LENGTH = 32;
export const DOMAINS_MAX = 10;
export const DOMAIN_MAX_LENGTH = 253;
export const PATH_MAX_LENGTH = 256;
export const SAMPLE_MAX_LENGTH = 512;
export const AUTHOR_NAME_MAX_LENGTH = 128;
const VARIABLE_NAME = /^[a-z][a-zA-Z0-9]{0,31}$/;
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

const plainText = (max: number) =>
  z
    .string()
    .max(max)
    .refine((value) => !CONTROL_CHARACTERS.test(value), "control characters")
    .transform((value) => value.replace(/\s+/g, " "));

const localized = (max: number) => z.partialRecord(z.enum(SUPPORTED_LOCALES), plainText(max));

const localId = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/);

const sourceSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("element"),
    selector: z
      .string()
      .min(1)
      .max(SELECTOR_MAX_LENGTH)
      .refine((value) => !CONTROL_CHARACTERS.test(value), "control characters"),
    read: z.enum(["text", "image", "link"])
  }),
  z.object({ kind: z.literal("tabTitle") }),
  z.object({
    kind: z.literal("meta"),
    property: z.enum(["og:title", "og:description", "og:image"])
  })
]);

const variableSchema = z.object({
  id: localId,
  name: z.string().regex(VARIABLE_NAME),
  source: sourceSchema,
  sample: plainText(SAMPLE_MAX_LENGTH).optional()
});

const customTemplate = z
  .string()
  .max(TEMPLATE_MAX_LENGTH)
  .refine((value) => !CONTROL_CHARACTERS.test(value), "control characters");

const imageSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("logo") }),
  z.object({
    kind: z.literal("variable"),
    variableId: localId
  }),
  z.object({
    kind: z.literal("custom"),
    template: customTemplate
  })
]);

const linkSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("page") }),
  z.object({
    kind: z.literal("variable"),
    variableId: localId
  }),
  z.object({
    kind: z.literal("custom"),
    template: customTemplate
  })
]);

const buttonSchema = z.object({
  id: localId,
  label: localized(BUTTON_LABEL_MAX_LENGTH),
  link: linkSchema.default({ kind: "page" })
});

const pageSchema = z.object({
  id: localId,
  name: plainText(PAGE_NAME_MAX_LENGTH),
  match: z.object({
    mode: z.enum(["any", "equals", "startsWith", "contains"]),
    path: z.string().max(PATH_MAX_LENGTH)
  }),
  activityType: z.enum(["watching", "listening", "playing", "competing"]),
  variables: z.array(variableSchema).max(VARIABLES_PER_PAGE_MAX),
  details: localized(PAGE_TEXT_MAX_LENGTH),
  state: localized(PAGE_TEXT_MAX_LENGTH),
  largeImage: imageSchema,
  timestamps: z.enum(["media", "elapsed"]),
  buttons: z.array(buttonSchema).max(BUTTONS_MAX)
});

export const creatorDefinitionSchema = z.object({
  id: z.string().regex(CREATOR_ID_PATTERN),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  step: z.enum(CREATOR_STEPS),
  name: plainText(PRESENCE_NAME_MAX_LENGTH),
  domains: z.array(z.string().min(1).max(DOMAIN_MAX_LENGTH)).min(1).max(DOMAINS_MAX),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  category: z.enum(["streaming", "music", "video", "social", "gaming", "tools", "ai", "learning", "creator", "other"]),
  baseLocale: z.enum(SUPPORTED_LOCALES),
  translationMode: z.enum(["manual", "auto"]),
  locales: z.array(z.enum(SUPPORTED_LOCALES)).max(SUPPORTED_LOCALES.length),
  description: localized(DESCRIPTION_MAX_LENGTH),
  longDescription: localized(LONG_DESCRIPTION_MAX_LENGTH),
  features: z.array(localized(FEATURE_MAX_LENGTH)).max(FEATURES_MAX),
  pages: z.array(pageSchema).min(1).max(PAGES_MAX),
  browsingFallback: z.boolean(),
  author: z.object({
    name: plainText(AUTHOR_NAME_MAX_LENGTH),
    github: z.string().max(64).optional(),
    discord: z.string().max(64).optional()
  })
});

export type CreatorDefinition = Omit<CreatorDraft, "assets" | "submission" | "sentSignature">;

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const upgradeLegacyPage = (page: unknown): unknown => {
  if (!isRecord(page) || "buttons" in page || !("button" in page)) return page;

  const { button, ...rest } = page;
  const legacy = isRecord(button) ? button : null;

  return {
    ...rest,
    buttons:
      legacy?.enabled === true
        ? [
            {
              id: "button1",
              label: legacy.label ?? {},
              link: legacy.link ?? { kind: "page" }
            }
          ]
        : []
  };
};

const upgradeLegacyDefinition = (value: unknown): unknown =>
  isRecord(value) && Array.isArray(value.pages) ? { ...value, pages: value.pages.map(upgradeLegacyPage) } : value;

export const parseCreatorDefinition = (value: unknown): CreatorDefinition | null => {
  const parsed = creatorDefinitionSchema.safeParse(upgradeLegacyDefinition(value));
  return parsed.success ? parsed.data : null;
};
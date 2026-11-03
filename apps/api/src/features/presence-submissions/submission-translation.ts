import { runJsonModel } from "@/shared/workers-ai";
import type { LocaleString } from "@nowly/locales";
import { BUTTON_LABEL_MAX_LENGTH, DESCRIPTION_MAX_LENGTH, FEATURE_MAX_LENGTH, LONG_DESCRIPTION_MAX_LENGTH, PAGE_TEXT_MAX_LENGTH, templateTokens, type CreatorDefinition, type LocalizedText } from "@nowly/presence-creator";
import { z } from "zod";

export const TRANSLATION_LOCALES: readonly LocaleString[] = ["en-US", "fr-FR", "es-ES"];

const TOKEN = /\{([a-zA-Z][a-zA-Z0-9]*)\}/g;
const MASK = /\{(\d+)\}/g;
const LEFTOVER_MASK = /\{\d+\}/;

type SourceItem = {
  key: string;
  text: string;
  max: number;
};

const ResultSchema = z.object({
  items: z.array(
    z.object({
      key: z.string(),
      text: z.string()
    })
  )
});

const RESULT_JSON_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: { type: "string" },
          text: { type: "string" }
        },
        required: ["key", "text"]
      }
    }
  },
  required: ["items"]
};

const collect = (definition: CreatorDefinition): SourceItem[] => {
  const base = definition.baseLocale;
  const item = (key: string, text: LocalizedText, max: number): SourceItem[] => {
    const value = text[base]?.trim();
    return value
      ? [
          {
            key,
            text: value,
            max
          }
        ]
      : [];
  };
  return [
    ...item("description", definition.description, DESCRIPTION_MAX_LENGTH),
    ...item("longDescription", definition.longDescription, LONG_DESCRIPTION_MAX_LENGTH),
    ...definition.features.flatMap((feature, index) => item(`features.${index}`, feature, FEATURE_MAX_LENGTH)),
    ...definition.pages.flatMap((page) => [
      ...item(`pages.${page.id}.details`, page.details, PAGE_TEXT_MAX_LENGTH),
      ...item(`pages.${page.id}.state`, page.state, PAGE_TEXT_MAX_LENGTH),
      ...item(`pages.${page.id}.label`, page.button.label, BUTTON_LABEL_MAX_LENGTH)
    ])
  ];
};

export const maskTokens = (text: string): {
  masked: string;
  tokens: string[];
} => {
  const tokens: string[] = [];
  const masked = text.replace(TOKEN, (match) => {
    tokens.push(match);
    return `{${tokens.length - 1}}`;
  });
  return { masked, tokens };
};

const sameTokens = (a: string, b: string): boolean => JSON.stringify(templateTokens(a).sort()) === JSON.stringify(templateTokens(b).sort());

export const shorten = (text: string, max: number): string => {
  if (text.length <= max) return text;

  const cut = text.slice(0, max + 1);
  const space = cut.lastIndexOf(" ");
  return (space > 0 ? cut.slice(0, space) : text.slice(0, max)).replace(/[\s,;:.-]+$/, "");
};

export const restoreTranslation = (source: SourceItem, translated: string | undefined, tokens: string[]): string => {
  if (!translated?.trim()) return source.text;

  const restored = translated.trim().replace(MASK, (match, index: string) => tokens[Number(index)] ?? match);
  const fitted = shorten(restored.replace(/\s+/g, " "), source.max);
  return sameTokens(fitted, source.text) && !LEFTOVER_MASK.test(fitted) ? fitted : source.text;
};

const translateTo = async (items: SourceItem[], from: LocaleString, to: LocaleString): Promise<Map<string, string>> => {
  const masked = items.map((item) => ({ item, ...maskTokens(item.text) }));

  const result = ResultSchema.safeParse(
    await runJsonModel(
      [
        {
          role: "system",
          content: `You translate the texts of a browser presence shown on Discord, from ${from} to ${to}. Keep every placeholder such as {0} exactly as written. Keep each text shorter than its "max" characters. Keep product names untranslated. Answer with JSON only: {"items":[{"key","text"}]}, one entry per input key.`
        },
        {
          role: "user",
          content: JSON.stringify(
            masked.map(({ item, masked: text }) => ({
              key: item.key,
              text,
              max: item.max
            }))
          )
        }
      ],
      RESULT_JSON_SCHEMA
    )
  );

  if (!result.success) throw new Error(`The translation to ${to} was not valid JSON.`);

  const byKey = new Map(result.data.items.map((entry) => [entry.key, entry.text]));
  return new Map(
    masked.map(({ item, tokens }) => [
      item.key,
      restoreTranslation(item, byKey.get(item.key), tokens)
    ])
  );
};

const withLocale = (text: LocalizedText, locale: LocaleString, value: string | undefined): LocalizedText =>
  value === undefined ? text : { ...text, [locale]: value };

export const applyTranslations = (definition: CreatorDefinition, translations: Map<LocaleString, Map<string, string>>): CreatorDefinition => {
  let next: CreatorDefinition = definition;

  for (const [locale, values] of translations) {
    next = {
      ...next,
      description: withLocale(next.description, locale, values.get("description")),
      longDescription: withLocale(next.longDescription, locale, values.get("longDescription")),
      features: next.features.map((feature, index) => withLocale(feature, locale, values.get(`features.${index}`))),
      pages: next.pages.map((page) => ({
        ...page,
        details: withLocale(page.details, locale, values.get(`pages.${page.id}.details`)),
        state: withLocale(page.state, locale, values.get(`pages.${page.id}.state`)),
        button: {
          ...page.button,
          label: withLocale(page.button.label, locale, values.get(`pages.${page.id}.label`))
        }
      }))
    };
  }

  return {
    ...next,
    translationMode: "manual",
    locales: [definition.baseLocale, ...translations.keys()]
  };
};

export const translateDefinition = async (definition: CreatorDefinition): Promise<CreatorDefinition> => {
  const items = collect(definition);
  const targets = TRANSLATION_LOCALES.filter((locale) => locale !== definition.baseLocale);

  const translations = new Map<LocaleString, Map<string, string>>();

  for (const locale of targets) translations.set(locale, await translateTo(items, definition.baseLocale, locale));

  return applyTranslations(definition, translations);
};
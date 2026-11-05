import { shorten } from "@/features/presence-submissions/submission-translation";
import { hasWorkersAi, runJsonModel } from "@/shared/workers-ai";
import { ANNOUNCEMENT_LOCALES, AnnouncementInputSchema, type AnnouncementInput, type AnnouncementLocale } from "@nowly/shared/announcements";
import { z } from "zod";

const SOURCE_LOCALE: AnnouncementLocale = "en";
const TITLE_MAX = 160;
const DESCRIPTION_MAX = 600;
const CONTENT_MAX = 20_000;
const URL_PATTERN = /https?:\/\/[^\s)\]>"']+/g;
const MASK_PATTERN = /\{(\d+)\}/g;
const LEFTOVER_MASK = /\{\d+\}/;

const LANGUAGE_NAMES: Record<AnnouncementLocale, string> = {
  en: "English",
  fr: "French",
  es: "Spanish",
  de: "German",
  "pt-BR": "Brazilian Portuguese",
  pl: "Polish",
  ja: "Japanese",
  ko: "Korean",
  tr: "Turkish",
  ms: "Malay",
  el: "Greek"
};

const ResultSchema = z.object({
  title: z.string(),
  description: z.string(),
  content: z.string().default("")
});

const RESULT_JSON_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    content: { type: "string" }
  },
  required: ["title", "description", "content"]
};

export type AnnouncementTexts = z.infer<typeof ResultSchema>;
type Texts = AnnouncementTexts;

export class TranslationFailedError extends Error {}

export class EnglishSourceRequiredError extends Error {}

export const maskUrls = (text: string): {
  masked: string;
  urls: string[];
} => {
  const urls: string[] = [];
  const masked = text.replace(URL_PATTERN, (match) => {
    urls.push(match);
    return `{${urls.length - 1}}`;
  });
  return { masked, urls };
};

export const restoreUrls = (text: string, urls: string[], max: number): string | null => {
  const restored = text.trim().replace(MASK_PATTERN, (match, index: string) => urls[Number(index)] ?? match);

  if (LEFTOVER_MASK.test(restored)) return null;

  const used = restored.match(URL_PATTERN) ?? [];

  if (used.length !== urls.length || !used.every((url) => urls.includes(url))) return null;

  return shorten(restored, max);
};

export const translateAnnouncementLocale = async (source: Texts, locale: AnnouncementLocale): Promise<Texts | null> => {
  const content = maskUrls(source.content);
  const parsed = ResultSchema.safeParse(
    await runJsonModel(
      [
        {
          role: "system",
          content: `You translate a product announcement from English to ${LANGUAGE_NAMES[locale]}. Keep every placeholder such as {0} exactly as written, keep Markdown syntax and product names untranslated, never add or remove content. Answer with JSON only: {"title","description","content"}.`
        },
        {
          role: "user",
          content: JSON.stringify({
            title: source.title,
            description: source.description,
            content: content.masked
          })
        }
      ],
      RESULT_JSON_SCHEMA
    )
  );

  if (!parsed.success) return null;

  const title = parsed.data.title.trim() ? shorten(parsed.data.title.trim(), TITLE_MAX) : null;
  const description = parsed.data.description.trim() ? shorten(parsed.data.description.trim(), DESCRIPTION_MAX) : null;
  const body = source.content ? restoreUrls(parsed.data.content, content.urls, CONTENT_MAX) : "";

  if (!title || !description || body === null) return null;

  return {
    title,
    description,
    content: body
  };
};

export const canTranslateAnnouncements = (): boolean => hasWorkersAi();

export const translateAnnouncement = async (input: AnnouncementInput): Promise<AnnouncementInput> => {
  const source = input.translations[SOURCE_LOCALE];

  if (!source) throw new EnglishSourceRequiredError();

  const missing = ANNOUNCEMENT_LOCALES.filter((locale) => locale !== SOURCE_LOCALE && !input.translations[locale]);

  const results = await Promise.all(
    missing.map(async (locale) => {
      try {
        return [
          locale,
          await translateAnnouncementLocale(source, locale)
        ] as const;
      } catch {
        throw new TranslationFailedError();
      }
    })
  );

  const generated = results.flatMap(([locale, texts]) => (texts ? [[locale, texts] as const] : []));

  if (generated.length === 0) throw new TranslationFailedError();

  const merge = (withContent: boolean): AnnouncementInput | null => {
    const parsed = AnnouncementInputSchema.safeParse({
      ...input,
      translations: {
        ...Object.fromEntries(generated.map(([locale, texts]) => [locale, withContent ? texts : { ...texts, content: "" }])),
        ...input.translations
      }
    });
    return parsed.success ? parsed.data : null;
  };

  return merge(true) ?? merge(false) ?? input;
};
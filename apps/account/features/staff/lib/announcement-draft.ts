import { ANNOUNCEMENT_LOCALES, type Announcement, type AnnouncementInput, type AnnouncementLocale } from "@nowly/shared/announcements";
import { translateAnnouncementText, type AnnouncementTexts } from "@/features/staff/lib/staff-api";

export type AnnouncementKind = Announcement["kind"];

export type AnnouncementDraft = {
  title: string;
  description: string;
  content: string;
  kind: AnnouncementKind;
  pinned: boolean;
  startsAt: string;
  endsAt: string;
};

export type AnnouncementStatus = "scheduled" | "live" | "ended";

export type TranslationProgress = {
  done: number;
  total: number;
};

const SOURCE_LOCALE: AnnouncementLocale = "en";
const TRANSLATIONS_MAX_BYTES = 24_000;
const TRANSLATION_CONCURRENCY = 4;
const DEFAULT_SEVERITY = 1;
const PAD = 2;

export const EMPTY_DRAFT: AnnouncementDraft = {
  title: "",
  description: "",
  content: "",
  kind: "normal",
  pinned: false,
  startsAt: "",
  endsAt: ""
};

const pad = (value: number): string => String(value).padStart(PAD, "0");

export const toLocalInputValue = (iso: string | null): string => {
  if (!iso) return "";

  const date = new Date(iso);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const fromLocalInputValue = (value: string): string | null => (value ? new Date(value).toISOString() : null);

export const sourceTexts = (item: Announcement): AnnouncementTexts => {
  const translation = item.translations[SOURCE_LOCALE] ?? Object.values(item.translations)[0];
  return {
    title: translation?.title ?? "",
    description: translation?.description ?? "",
    content: translation?.content ?? ""
  };
};

export const draftFromAnnouncement = (item: Announcement): AnnouncementDraft => ({
  ...sourceTexts(item),
  kind: item.kind,
  pinned: item.pinned,
  startsAt: toLocalInputValue(item.startsAt),
  endsAt: toLocalInputValue(item.endsAt)
});

export const isDraftValid = (draft: AnnouncementDraft): boolean => {
  const starts = draft.startsAt ? Date.parse(draft.startsAt) : null;
  const ends = draft.endsAt ? Date.parse(draft.endsAt) : null;
  return draft.title.trim().length > 0 && draft.description.trim().length > 0 && (starts === null || ends === null || starts < ends);
};

export const textsChanged = (draft: AnnouncementDraft, item: Announcement): boolean => {
  const source = sourceTexts(item);
  return draft.title.trim() !== source.title || draft.description.trim() !== source.description || draft.content.trim() !== source.content;
};

export const announcementStatus = (item: Announcement, now: number): AnnouncementStatus => {
  if ((item.expiresAt && Date.parse(item.expiresAt) <= now) || (item.endsAt && Date.parse(item.endsAt) <= now)) return "ended";

  return item.startsAt && Date.parse(item.startsAt) > now ? "scheduled" : "live";
};

const byteLength = (value: unknown): number => new TextEncoder().encode(JSON.stringify(value)).byteLength;

export const buildInput = (draft: AnnouncementDraft, translations: AnnouncementInput["translations"], previous?: Announcement): AnnouncementInput => {
  const isMaintenance = draft.kind === "maintenance";
  const severity = draft.kind === "warning" ? (previous?.severity ?? DEFAULT_SEVERITY) : null;
  return {
    translations,
    kind: draft.kind,
    severity,
    pinned: draft.pinned,
    startsAt: isMaintenance ? fromLocalInputValue(draft.startsAt) : (previous?.startsAt ?? null),
    endsAt: isMaintenance ? fromLocalInputValue(draft.endsAt) : (previous?.endsAt ?? null),
    expiresAt: previous?.expiresAt ?? null
  };
};

export const translateAll = async (source: AnnouncementTexts, onProgress: (progress: TranslationProgress) => void): Promise<
  AnnouncementInput["translations"]
> => {
  const locales = ANNOUNCEMENT_LOCALES.filter((locale) => locale !== SOURCE_LOCALE);

  const generated: AnnouncementInput["translations"] = {};
  let done = 0;
  let next = 0;
  let unavailable = false;
  let failures = 0;
  onProgress({
    done,
    total: locales.length
  });

  const worker = async (): Promise<void> => {
    while (!unavailable && next < locales.length) {
      const locale = locales[next++];
      const outcome = await translateAnnouncementText(locale, source).catch((): "failed" => "failed");

      if (outcome === "unavailable") unavailable = true;
      else if (outcome === "failed") failures += 1;
      else generated[locale] = outcome;

      onProgress({
        done: ++done,
        total: locales.length
      });
    }
  };

  await Promise.all(Array.from({ length: TRANSLATION_CONCURRENCY }, worker));

  if (!unavailable && failures === locales.length) throw new Error("TRANSLATION_FAILED");

  const withContent = {
    ...generated,
    [SOURCE_LOCALE]: source
  };

  if (byteLength(withContent) <= TRANSLATIONS_MAX_BYTES) return withContent;

  return Object.fromEntries(Object.entries(withContent).map(([locale, texts]) => [locale, locale === SOURCE_LOCALE ? texts : { ...texts, content: "" }]));
};

export const keepTranslations = (item: Announcement, draft: AnnouncementDraft): AnnouncementInput["translations"] => ({
  ...item.translations,
  [SOURCE_LOCALE]: {
    title: draft.title.trim(),
    description: draft.description.trim(),
    content: draft.content.trim()
  }
});
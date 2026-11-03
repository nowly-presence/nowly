import { ANNOUNCEMENT_LOCALES, type AnnouncementInput, type AnnouncementLocale } from "@nowly/shared/announcements";

export type AnnouncementKind = AnnouncementInput["kind"];

export type AnnouncementSeverity = 1 | 2 | 3;

export type AnnouncementTexts = {
  title: string;
  description: string;
  content: string;
};

export type AnnouncementForm = {
  texts: Partial<Record<AnnouncementLocale, AnnouncementTexts>>;
  kind: AnnouncementKind;
  severity: AnnouncementSeverity;
  pinned: boolean;
  startsAt: string;
  expiresAt: string;
};

export type AnnouncementIssue = "TEXTS_MISSING" | "TEXTS_INCOMPLETE" | "DATES_ORDER";

export const TITLE_MAX_LENGTH = 160;
export const DESCRIPTION_MAX_LENGTH = 600;
export const CONTENT_MAX_LENGTH = 20_000;

export const EMPTY_TEXTS: AnnouncementTexts = {
  title: "",
  description: "",
  content: ""
};

export const emptyAnnouncementForm = (): AnnouncementForm => ({
  texts: {},
  kind: "normal",
  severity: 1,
  pinned: false,
  startsAt: "",
  expiresAt: ""
});

const toIso = (value: string): string | null => {
  if (!value) return null;

  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : new Date(time).toISOString();
};

const isFilled = (texts: AnnouncementTexts | undefined): texts is AnnouncementTexts => Boolean(texts && texts.title.trim() && texts.description.trim());

const isStarted = (texts: AnnouncementTexts | undefined): boolean => Boolean(texts && (texts.title.trim() || texts.description.trim() || texts.content.trim()));

export const announcementIssues = (form: AnnouncementForm): AnnouncementIssue[] => {
  const issues: AnnouncementIssue[] = [];
  const entries = ANNOUNCEMENT_LOCALES.map((locale) => form.texts[locale]);

  if (!entries.some(isFilled)) issues.push("TEXTS_MISSING");
  if (entries.some((texts) => isStarted(texts) && !isFilled(texts))) issues.push("TEXTS_INCOMPLETE");

  const starts = toIso(form.startsAt);
  const expires = toIso(form.expiresAt);

  if (starts && expires && Date.parse(starts) >= Date.parse(expires)) issues.push("DATES_ORDER");

  return issues;
};

export const buildAnnouncementInput = (form: AnnouncementForm): AnnouncementInput => ({
  translations: Object.fromEntries(
    ANNOUNCEMENT_LOCALES.flatMap((locale) => {
      const texts = form.texts[locale];
      return isFilled(texts)
        ? [
            [
              locale,
              {
                title: texts.title.trim(),
                description: texts.description.trim(),
                content: texts.content.trim()
              }
            ]
          ]
        : [];
    })
  ),
  kind: form.kind,
  severity: form.kind === "warning" ? form.severity : null,
  pinned: form.pinned,
  startsAt: toIso(form.startsAt),
  endsAt: null,
  expiresAt: toIso(form.expiresAt)
});
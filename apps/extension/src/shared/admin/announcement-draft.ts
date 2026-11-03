import type { AnnouncementDraft } from "@/shared/admin/admin-types";
import type { AnnouncementInput } from "@nowly/shared/announcements";

export type AnnouncementKind = AnnouncementInput["kind"];

export type AnnouncementSeverity = 1 | 2 | 3;

export type AnnouncementTexts = {
  title: string;
  description: string;
  content: string;
};

export type AnnouncementForm = {
  texts: AnnouncementTexts;
  translate: boolean;
  kind: AnnouncementKind;
  severity: AnnouncementSeverity;
  pinned: boolean;
  startsAt: string;
  expiresAt: string;
};

export type AnnouncementIssue = "TEXTS_MISSING" | "DATES_ORDER";

export const TITLE_MAX_LENGTH = 160;
export const DESCRIPTION_MAX_LENGTH = 600;
export const CONTENT_MAX_LENGTH = 20_000;

export const EMPTY_TEXTS: AnnouncementTexts = {
  title: "",
  description: "",
  content: ""
};

export const emptyAnnouncementForm = (): AnnouncementForm => ({
  texts: EMPTY_TEXTS,
  translate: true,
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

const isFilled = (texts: AnnouncementTexts): boolean => Boolean(texts.title.trim() && texts.description.trim());

export const announcementIssues = (form: AnnouncementForm): AnnouncementIssue[] => {
  const issues: AnnouncementIssue[] = [];

  if (!isFilled(form.texts)) issues.push("TEXTS_MISSING");

  const starts = toIso(form.startsAt);
  const expires = toIso(form.expiresAt);

  if (starts && expires && Date.parse(starts) >= Date.parse(expires)) issues.push("DATES_ORDER");

  return issues;
};

export const buildAnnouncementInput = (form: AnnouncementForm): AnnouncementDraft => ({
  translations: {
    en: {
      title: form.texts.title.trim(),
      description: form.texts.description.trim(),
      content: form.texts.content.trim()
    }
  },
  translate: form.translate,
  kind: form.kind,
  severity: form.kind === "warning" ? form.severity : null,
  pinned: form.pinned,
  startsAt: toIso(form.startsAt),
  endsAt: null,
  expiresAt: toIso(form.expiresAt)
});
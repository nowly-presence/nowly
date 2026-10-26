import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AnnouncementSchema, type Announcement, type AnnouncementLocale } from "@nowly/shared/announcements";

const moduleDirectory = dirname(fileURLToPath(import.meta.url));
const roots = [
  resolve(moduleDirectory, "../../../packages/changelog/content"),
  resolve(moduleDirectory, "../../../../../packages/changelog/content")
];
const LOCALES: Record<AnnouncementLocale, string> = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  de: "de-DE",
  "pt-BR": "pt-BR",
  pl: "pl-PL",
  ja: "ja-JP",
  ko: "ko-KR",
  tr: "tr-TR",
  ms: "ms-MY",
  el: "el-GR"
};

const releaseTimestamp = (value: string): string | null => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const timestamp = Date.parse(`${value}T00:00:00.000Z`);

    if (!Number.isFinite(timestamp)) return null;

    const iso = new Date(timestamp).toISOString();
    return iso.slice(0, 10) === value ? iso : null;
  }

  const englishDate = /^(January|February|March|April|May|June|July|August|September|October|November|December) ([1-9]|[12]\d|3[01]), (\d{4})$/.exec(value);

  if (!englishDate) return null;

  const timestamp = Date.parse(`${value} 00:00:00 GMT`);

  if (!Number.isFinite(timestamp) || new Date(timestamp).getUTCDate() !== Number(englishDate[2])) return null;

  return new Date(timestamp).toISOString();
};

const parseDocument = (text: string) => {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(text);

  if (!match) return null;

  const field = (name: string) =>
    new RegExp(`^${name}:\\s*(.+)$`, "m")
      .exec(match[1])?.[1]
      ?.trim()
      .replace(/^['"]|['"]$/g, "") ?? "";
  return {
    title: field("title"),
    description: field("description"),
    date: field("date"),
    body: match[2],
    published: field("published") !== "false" && field("draft") !== "true"
  };
};

export const readReleaseAnnouncements = async (locale: AnnouncementLocale, now = Date.now()): Promise<Announcement[]> => {
  let root: string | undefined;
  let slugs: string[] = [];

  for (const candidate of roots) {
    try {
      slugs = (await readdir(candidate)).filter((slug) => /^\d+-\d+-\d+(?:-\d+)?$/.test(slug));
      root = candidate;
      break;
    } catch {}
  }

  if (!root) return [];

  const items = await Promise.all(
    slugs.map(async (slug) => {
      try {
        const canonical = parseDocument(await readFile(resolve(root, slug, "en-US.mdx"), "utf8"));

        if (!canonical?.published) return [];

        const publishedAt = releaseTimestamp(canonical.date);

        if (!publishedAt || Date.parse(publishedAt) > now) return [];

        let localized = canonical;

        if (locale !== "en") {
          try {
            const translated = parseDocument(await readFile(resolve(root, slug, `${LOCALES[locale]}.mdx`), "utf8"));

            if (translated?.published) localized = translated;
          } catch {}
        }

        const parsed = AnnouncementSchema.safeParse({
          id: `release-${slug}`,
          source: "changelog",
          translations: {
            [locale]: {
              title: localized.title,
              description: localized.description,
              content: localized.body
            }
          },
          kind: "normal",
          severity: null,
          pinned: false,
          startsAt: null,
          endsAt: null,
          expiresAt: null,
          publishedAt,
          updatedAt: publishedAt
        });
        return parsed.success ? [parsed.data] : [];
      } catch {
        return [];
      }
    })
  );
  return items.flat();
};
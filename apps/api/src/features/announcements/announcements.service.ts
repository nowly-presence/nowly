import { getDb } from "@/db/client";
import { announcement } from "@nowly/database/schema/announcement";
import { and, desc, isNull, lte, gt, or } from "drizzle-orm";
import { readReleaseAnnouncements } from "@/features/announcements/announcements.changelog";
import { ANNOUNCEMENT_LIMIT, AnnouncementFeedSchema, AnnouncementSchema, isAnnouncementVisible, type AnnouncementInput, type AnnouncementLocale } from "@nowly/shared/announcements";

const iso = (date: Date | null) => date?.toISOString() ?? null;

export const createAnnouncement = async (input: AnnouncementInput) => {
  const [row] = await getDb()
    .insert(announcement)
    .values({
      translations: input.translations,
      kind: input.kind,
      severity: input.severity,
      pinned: input.pinned,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null
    })
    .returning();
  return AnnouncementSchema.parse({
    id: row.id,
    source: "announcement",
    translations: row.translations,
    kind: row.kind,
    severity: row.severity,
    pinned: row.pinned,
    startsAt: iso(row.startsAt),
    endsAt: iso(row.endsAt),
    expiresAt: iso(row.expiresAt),
    publishedAt: row.publishedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  });
};

export const getAnnouncementFeed = async (locale: AnnouncementLocale) => {
  const now = new Date();
  const rows = await getDb()
    .select()
    .from(announcement)
    .where(
      and(
        lte(announcement.publishedAt, now),
        or(isNull(announcement.startsAt), lte(announcement.startsAt, now)),
        or(isNull(announcement.expiresAt), gt(announcement.expiresAt, now))
      )
    )
    .orderBy(desc(announcement.pinned), desc(announcement.publishedAt))
    .limit(ANNOUNCEMENT_LIMIT);
  const posts = rows
    .map((row) =>
      AnnouncementSchema.parse({
        id: row.id,
        translations: row.translations,
        kind: row.kind,
        severity: row.severity,
        pinned: row.pinned,
        source: "announcement",
        startsAt: iso(row.startsAt),
        endsAt: iso(row.endsAt),
        expiresAt: iso(row.expiresAt),
        publishedAt: row.publishedAt.toISOString(),
        updatedAt: row.updatedAt.toISOString()
      })
    )
    .filter((item) => isAnnouncementVisible(item, now.getTime()));

  const releases = await readReleaseAnnouncements(locale, now.getTime());
  return AnnouncementFeedSchema.parse({
    items: [...posts, ...releases]
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
      .slice(0, ANNOUNCEMENT_LIMIT)
  });
};
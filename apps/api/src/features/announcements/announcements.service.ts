import { getPrisma } from "@/db/client";
import { readReleaseAnnouncements } from "@/features/announcements/announcements.changelog";
import { ANNOUNCEMENT_LIMIT, AnnouncementFeedSchema, AnnouncementSchema, isAnnouncementVisible, type AnnouncementInput, type AnnouncementLocale } from "@nowly/shared/announcements";

const iso = (date: Date | null) => date?.toISOString() ?? null;

export const createAnnouncement = async (input: AnnouncementInput) => {
  const row = await getPrisma().announcement.create({
    data: {
      translations: input.translations,
      kind: input.kind,
      severity: input.severity,
      pinned: input.pinned,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null
    }
  });
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
  const rows = await getPrisma().announcement.findMany({
    where: {
      publishedAt: { lte: now },
      AND: [
        {
          OR: [
            { startsAt: null },
            {
              startsAt: { lte: now }
            }
          ]
        },
        {
          OR: [
            { expiresAt: null },
            {
              expiresAt: { gt: now }
            }
          ]
        }
      ]
    },
    orderBy: [
      { pinned: "desc" },
      { publishedAt: "desc" }
    ],
    take: ANNOUNCEMENT_LIMIT,
    select: {
      id: true,
      translations: true,
      kind: true,
      severity: true,
      pinned: true,
      startsAt: true,
      endsAt: true,
      expiresAt: true,
      publishedAt: true,
      updatedAt: true
    }
  });
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
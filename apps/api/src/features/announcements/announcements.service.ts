import { getDb } from "@/db/client";
import { recordAdminAction, type AuditActor } from "@/features/admin/audit.service";
import { announcement } from "@nowly/database/schema/announcement";
import { and, desc, eq, isNull, lte, gt, or } from "drizzle-orm";
import { readReleaseAnnouncements } from "@/features/announcements/announcements.changelog";
import { ANNOUNCEMENT_LIMIT, AnnouncementFeedSchema, AnnouncementSchema, isAnnouncementVisible, type AnnouncementInput, type AnnouncementLocale } from "@nowly/shared/announcements";

const iso = (date: Date | null) => date?.toISOString() ?? null;

const MANAGE_LIMIT = 200;

const toAnnouncement = (row: typeof announcement.$inferSelect) =>
  AnnouncementSchema.parse({
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

const toDate = (value: string | null) => (value ? new Date(value) : null);

export const createAnnouncement = async (input: AnnouncementInput, actor: AuditActor) => {
  const row = await getDb().transaction(async (tx) => {
    const [created] = await tx
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
    await recordAdminAction(tx, actor, {
      action: "announcement.create",
      targetType: "announcement",
      targetId: created.id,
      details: { kind: created.kind }
    });
    return created;
  });
  return toAnnouncement(row);
};

export const listManagedAnnouncements = async () => {
  const rows = await getDb().select().from(announcement).orderBy(desc(announcement.publishedAt)).limit(MANAGE_LIMIT);
  return rows.map(toAnnouncement);
};

export const updateAnnouncement = async (id: string, input: AnnouncementInput, actor: AuditActor) => {
  const row = await getDb().transaction(async (tx) => {
    const [updated] = await tx
      .update(announcement)
      .set({
        translations: input.translations,
        kind: input.kind,
        severity: input.severity,
        pinned: input.pinned,
        startsAt: toDate(input.startsAt),
        endsAt: toDate(input.endsAt),
        expiresAt: toDate(input.expiresAt),
        updatedAt: new Date()
      })
      .where(eq(announcement.id, id))
      .returning();

    if (!updated) return null;

    await recordAdminAction(tx, actor, {
      action: "announcement.update",
      targetType: "announcement",
      targetId: updated.id,
      details: {
        kind: updated.kind,
        pinned: updated.pinned
      }
    });
    return updated;
  });
  return row ? toAnnouncement(row) : null;
};

export const deleteAnnouncement = async (id: string, actor: AuditActor) =>
  getDb().transaction(async (tx) => {
    const [removed] = await tx.delete(announcement).where(eq(announcement.id, id)).returning({
      id: announcement.id,
      kind: announcement.kind
    });

    if (!removed) return false;

    await recordAdminAction(tx, actor, {
      action: "announcement.delete",
      targetType: "announcement",
      targetId: removed.id,
      details: { kind: removed.kind }
    });
    return true;
  });

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
  const posts = rows.map(toAnnouncement).filter((item) => isAnnouncementVisible(item, now.getTime()));

  const releases = await readReleaseAnnouncements(locale, now.getTime());
  return AnnouncementFeedSchema.parse({
    items: [...posts, ...releases]
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
      .slice(0, ANNOUNCEMENT_LIMIT)
  });
};
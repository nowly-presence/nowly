import { linkedDiscordId } from "@/features/account/discord-link.service";
import { getDb } from "@/db/client";
import { user } from "@nowly/database/schema/auth";
import { creatorPresence, presenceSubmission, presenceSubmissionEvent, presenceSubmissionRevision } from "@nowly/database/schema/creator";
import { presence } from "@nowly/database/schema/presence";
import { buildTextFiles, diffDefinitions, normalizeDraft, parseCreatorDefinition, presenceSlug, validateDraft, type CreatorDefinition, type CreatorDraft } from "@nowly/presence-creator";
import { and, desc, eq, inArray } from "drizzle-orm";
import { randomBytes, randomUUID } from "node:crypto";
import { hasObjectStorage } from "@/shared/object-storage";
import { SubmissionError } from "./submission-errors";
import { checkCreatorImages, type CreatorImage, type CreatorImageKind } from "./submission-images";
import { EDITABLE_STATUSES, isOneOf, OPEN_STATUSES } from "./submission-status";
import { removeCreatorImages, storedKeys, storeCreatorImages } from "./submission-storage";

const SUBMISSION_ID_BYTES = 12;
const ISSUES_IN_MESSAGE = 3;

export type SubmissionSummary = {
  id: string;
  status: string;
  revision: number;
  updatedAt: string;
  prUrl?: string;
  note?: string;
};

export const toSummary = (row: typeof presenceSubmission.$inferSelect): SubmissionSummary => ({
  id: row.id,
  status: row.status,
  revision: row.revision,
  updatedAt: row.updatedAt.toISOString(),
  ...(row.prUrl ? { prUrl: row.prUrl } : {}),
  ...(row.note ? { note: row.note } : {})
});

const imageName = (images: CreatorImage[], kind: CreatorImageKind): string | undefined => images.find((image) => image.kind === kind)?.fileName;

const asDraft = (definition: CreatorDefinition, images: CreatorImage[]): CreatorDraft =>
  normalizeDraft({
    ...definition,
    assets: {
      thumbnail: imageName(images, "thumbnail"),
      logo: imageName(images, "logo"),
      icon: imageName(images, "icon"),
      iconTransparent: true,
      thumbnailRightsConfirmed: true
    }
  });

const verifiedImages = async (assets: Record<CreatorImageKind, string>): Promise<CreatorImage[]> => {
  const check = await checkCreatorImages(assets);

  if (!check.ok) throw new SubmissionError("INVALID_IMAGE", `The ${check.kind} image is invalid (${check.reason}).`);

  return check.images;
};

const assertNoOtherPending = async (slug: string, authorId: string, draftId: string): Promise<void> => {
  const pending = await getDb()
    .select({
      slug: presenceSubmission.slug,
      authorId: presenceSubmission.authorId,
      draftId: presenceSubmission.draftId
    })
    .from(presenceSubmission)
    .where(and(eq(presenceSubmission.slug, slug), inArray(presenceSubmission.status, [...OPEN_STATUSES])));

  if (pending.some((row) => row.authorId !== authorId || row.draftId !== draftId)) {
    throw new SubmissionError("SUBMISSION_PENDING", "Another submission for this presence is already under review.");
  }
};

const assertEditable = (status: string | undefined): void => {
  if (status !== undefined && !isOneOf(status, EDITABLE_STATUSES)) throw new SubmissionError(
    "SUBMISSION_LOCKED",
    "This submission is under review and cannot be changed now."
  );
};

export const submitPresence = async (input: {
  userId: string;
  definition: unknown;
  translate: boolean;
  assets: Record<CreatorImageKind, string>;
}): Promise<SubmissionSummary> => {
  const db = getDb();
  const [author] = await db
    .select({
      name: user.name,
      discordId: user.discordId
    })
    .from(user)
    .where(eq(user.id, input.userId))
    .limit(1);

  const discordId = author ? (author.discordId ?? (await linkedDiscordId(input.userId))) : null;

  if (!author || !discordId) throw new SubmissionError("CREATOR_REQUIRED", "Link a Discord account to publish presences.");

  const parsed = parseCreatorDefinition(input.definition);

  if (!parsed) throw new SubmissionError("INVALID_DEFINITION", "The presence definition is invalid.");

  const definition: CreatorDefinition = {
    ...parsed,
    author: {
      name: author.name,
      discord: discordId
    }
  };
  const slug = presenceSlug(definition.name);
  const [base] = await db.select().from(creatorPresence).where(eq(creatorPresence.slug, slug)).limit(1);

  const [catalogEntry] = base ? [] : await db.select({ slug: presence.slug }).from(presence).where(eq(presence.slug, slug)).limit(1);

  if (catalogEntry) throw new SubmissionError("NOT_CREATOR_PRESENCE", "This presence was not made with the creator and cannot be edited here.");

  const images = await verifiedImages(input.assets);

  const draft = asDraft(definition, images);
  await assertNoOtherPending(slug, input.userId, definition.id);
  const issues = validateDraft(draft);

  if (issues.length) {
    throw new SubmissionError(
      "INVALID_DEFINITION",
      `The presence is not ready: ${issues
        .slice(0, ISSUES_IN_MESSAGE)
        .map((issue) => issue.code)
        .join(", ")}.`
    );
  }

  const files = buildTextFiles(draft);
  const ownSubmission = and(eq(presenceSubmission.authorId, input.userId), eq(presenceSubmission.draftId, definition.id));
  const [current] = await db
    .select({
      id: presenceSubmission.id,
      revision: presenceSubmission.revision,
      status: presenceSubmission.status
    })
    .from(presenceSubmission)
    .where(ownSubmission)
    .limit(1);

  assertEditable(current?.status);

  if (!hasObjectStorage()) throw new SubmissionError("STORAGE_UNAVAILABLE", "Image storage is not configured.");

  const id = current?.id ?? randomBytes(SUBMISSION_ID_BYTES).toString("hex");
  const revision = (current?.revision ?? 0) + 1;
  const assets = await storeCreatorImages(id, revision, images);

  return db
    .transaction(async (tx) => {
      const now = new Date();
      const [existing] = await tx.select().from(presenceSubmission).where(ownSubmission).for("update");

      if (existing?.revision !== current?.revision) throw new SubmissionError("STALE_REVISION", "This submission changed while it was being sent.");

      assertEditable(existing?.status);

      const [previous] = existing
        ? await tx
            .select({ definition: presenceSubmissionRevision.definition })
            .from(presenceSubmissionRevision)
            .where(eq(presenceSubmissionRevision.submissionId, existing.id))
            .orderBy(desc(presenceSubmissionRevision.number))
            .limit(1)
        : [];
      const before = parseCreatorDefinition(previous?.definition ?? base?.definition ?? null);

      const [row] = existing
        ? await tx
            .update(presenceSubmission)
            .set({
              status: "submitted",
              revision,
              slug,
              translate: input.translate,
              note: null,
              updatedAt: now
            })
            .where(eq(presenceSubmission.id, existing.id))
            .returning()
        : await tx
            .insert(presenceSubmission)
            .values({
              id,
              draftId: definition.id,
              authorId: input.userId,
              kind: base ? "update" : "create",
              slug,
              baseRevision: base?.revision ?? null,
              status: "submitted",
              translate: input.translate
            })
            .returning();

      await tx.insert(presenceSubmissionRevision).values({
        id: randomUUID(),
        submissionId: id,
        number: revision,
        authorId: input.userId,
        definition,
        files,
        changes: diffDefinitions(before, definition),
        assets
      });
      await tx.insert(presenceSubmissionEvent).values({
        id: randomUUID(),
        submissionId: id,
        revision,
        type: existing ? "resubmitted" : "submitted",
        status: "submitted",
        actorId: input.userId
      });
      return toSummary(row);
    })
    .catch(async (error: unknown) => {
      await removeCreatorImages(storedKeys(assets)).catch(() => undefined);
      throw error;
    });
};

export const listOwnSubmissions = async (userId: string, ids: string[]): Promise<SubmissionSummary[]> => {
  if (!ids.length) return [];

  const rows = await getDb()
    .select()
    .from(presenceSubmission)
    .where(and(eq(presenceSubmission.authorId, userId), inArray(presenceSubmission.id, ids)));
  return rows.map(toSummary);
};
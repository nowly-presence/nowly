import { getDb } from "@/db/client";
import { githubInstallationClient, hasGithubApp } from "@/shared/github-app";
import { user } from "@nowly/database/schema/auth";
import { presenceSubmission, presenceSubmissionEvent, presenceSubmissionRevision } from "@nowly/database/schema/creator";
import { buildTextFiles, normalizeDraft, parseCreatorDefinition, presenceFolder, validateDraft } from "@nowly/presence-creator";
import { and, asc, eq, isNull, lt, or } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { commitOnBase, deletedEntry, fileExists, listFolderFiles, openOrReusePullRequest, pullRequestBody, pushBranch, textEntry, uploadBlob } from "./nolo-repository";
import { CREATOR_IMAGE_KINDS, IMAGE_SPECS } from "./submission-images";
import { readCreatorImage } from "./submission-storage";

const MINUTE_MS = 60_000;
export const PR_LEASE_MS = 10 * MINUTE_MS;
export const PENDING_BATCH = 10;
const SHORT_ID_LENGTH = 8;
const ERROR_MAX_LENGTH = 300;

export type PullRequestOutcome = "opened" | "collision" | "skipped" | "failed";

const AssetsSchema = z.object({
  thumbnail: z.string(),
  logo: z.string(),
  icon: z.string()
});

const pending = (now: Date) =>
  and(
    eq(presenceSubmission.status, "in_progress"),
    or(isNull(presenceSubmission.prRevision), lt(presenceSubmission.prRevision, presenceSubmission.revision)),
    or(isNull(presenceSubmission.prClaimedAt), lt(presenceSubmission.prClaimedAt, new Date(now.getTime() - PR_LEASE_MS)))
  );

const claim = async (id: string) => {
  const now = new Date();
  const [row] = await getDb()
    .update(presenceSubmission)
    .set({ prClaimedAt: now })
    .where(and(eq(presenceSubmission.id, id), pending(now)))
    .returning();
  return row ?? null;
};

const recordEvent = async (submissionId: string, revision: number, type: string, status: string, details: Record<string, unknown>) => {
  await getDb().insert(presenceSubmissionEvent).values({
    id: randomUUID(),
    submissionId,
    revision,
    type,
    status,
    actorId: null,
    details
  });
};

const markCollision = async (row: typeof presenceSubmission.$inferSelect, folder: string): Promise<PullRequestOutcome> => {
  const note = `A presence named "${folder.split("/").at(-1)}" already exists in the repository. Pick another name.`;
  await getDb()
    .update(presenceSubmission)
    .set({
      status: "changes_requested",
      note,
      prClaimedAt: null,
      prError: null,
      updatedAt: new Date()
    })
    .where(eq(presenceSubmission.id, row.id));
  await recordEvent(row.id, row.revision, "pr.collision", "changes_requested", { folder });
  return "collision";
};

const buildPullRequest = async (row: typeof presenceSubmission.$inferSelect): Promise<PullRequestOutcome> => {
  const db = getDb();
  const [revision] = await db
    .select()
    .from(presenceSubmissionRevision)
    .where(and(eq(presenceSubmissionRevision.submissionId, row.id), eq(presenceSubmissionRevision.number, row.revision)))
    .limit(1);

  const definition = parseCreatorDefinition(revision?.definition ?? null);
  const assets = AssetsSchema.safeParse(revision?.assets);

  if (!revision || !definition || !assets.success) throw new Error("The revision has no valid definition or images.");

  const draft = normalizeDraft({
    ...definition,
    assets: {
      thumbnail: assets.data.thumbnail,
      logo: assets.data.logo,
      icon: assets.data.icon,
      iconTransparent: true,
      thumbnailRightsConfirmed: true
    }
  });
  const issues = validateDraft(draft);

  if (issues.length) throw new Error(`The definition is not valid anymore: ${issues.map((issue) => issue.code).join(", ")}.`);

  const [author] = await db
    .select({
      name: user.name,
      discordId: user.discordId
    })
    .from(user)
    .where(eq(user.id, row.authorId))
    .limit(1);

  const folder = presenceFolder(draft.name);
  const github = await githubInstallationClient();

  if (row.kind === "create" && (await fileExists(github, `${folder}/metadata.json`))) return markCollision(row, folder);

  const files = buildTextFiles(draft);
  const images = await Promise.all(
    CREATOR_IMAGE_KINDS.map(async (kind) => uploadBlob(github, `${folder}/assets/${IMAGE_SPECS[kind].fileName}`, await readCreatorImage(assets.data[kind])))
  );

  const generated = new Set(files.map((file) => file.path));
  const removed = row.kind === "update" ? (await listFolderFiles(github, `${folder}/locales`)).filter((path) => !generated.has(path)) : [];
  const message = `feat(${row.slug}): ${row.kind === "create" ? "add" : "update"} ${draft.name} from the creator`;
  const commitSha = await commitOnBase(github, [...files.map((file) => textEntry(file.path, file.content)), ...images, ...removed.map(deletedEntry)], message);

  const branch = `creator/${row.slug}-${row.id.slice(0, SHORT_ID_LENGTH)}`;
  await pushBranch(github, branch, commitSha);

  const pull = await openOrReusePullRequest(github, {
    branch,
    title: message,
    body: pullRequestBody({
      submissionId: row.id,
      definition: draft,
      author: {
        name: author?.name ?? draft.author.name,
        discordId: author?.discordId ?? null
      }
    })
  });
  await db
    .update(presenceSubmission)
    .set({
      prNumber: pull.number,
      prUrl: pull.html_url,
      prRevision: row.revision,
      prClaimedAt: null,
      prError: null,
      updatedAt: new Date()
    })
    .where(eq(presenceSubmission.id, row.id));
  await recordEvent(row.id, row.revision, "pr.opened", row.status, {
    pr: pull.number,
    url: pull.html_url,
    commit: commitSha
  });
  return "opened";
};

export const openSubmissionPullRequest = async (submissionId: string): Promise<PullRequestOutcome> => {
  if (!hasGithubApp()) return "skipped";

  const row = await claim(submissionId);

  if (!row) return "skipped";

  return buildPullRequest(row).catch(async (error: unknown): Promise<PullRequestOutcome> => {
    const message = (error instanceof Error ? error.message : "Unknown error").slice(0, ERROR_MAX_LENGTH);
    await getDb()
      .update(presenceSubmission)
      .set({
        prClaimedAt: null,
        prError: message
      })
      .where(eq(presenceSubmission.id, submissionId));
    return "failed";
  });
};

export const openPendingPullRequests = async (): Promise<Record<PullRequestOutcome, number>> => {
  const counts: Record<PullRequestOutcome, number> = {
    opened: 0,
    collision: 0,
    skipped: 0,
    failed: 0
  };

  if (!hasGithubApp()) return counts;

  const rows = await getDb()
    .select({ id: presenceSubmission.id })
    .from(presenceSubmission)
    .where(pending(new Date()))
    .orderBy(asc(presenceSubmission.updatedAt))
    .limit(PENDING_BATCH);

  for (const row of rows) counts[await openSubmissionPullRequest(row.id)] += 1;

  return counts;
};
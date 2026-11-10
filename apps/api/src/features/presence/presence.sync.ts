import { FALLBACK_LOCALE } from "@nowly/locales";
import { formatBytes, getPresenceAliasIssues, type PresenceAliasEntry } from "@nowly/shared";
import { generateChangelog, translateChangelog } from "@/shared/changelog.service";
import { sha256Base64Url } from "@/shared/crypto.service";
import { serializeJsonField } from "./presence.service";
import { getAllPresenceMetas, getAllPresenceSlugs, getPresenceVersion, getVersionHistory, savePresenceRelease, setArchived } from "./presence.repository";

type ReleasePerson = {
  name: string;
  github?: string;
};

export type PresenceSyncEntry = {
  slug: string;
  type: "new" | "modified";
  name: string;
  category?: string;
  author?: string;
  authorGithub?: string;
  releaseAuthor?: ReleasePerson;
  releaseContributors?: ReleasePerson[];
  version?: string;
  versionType?: string;
  description?: Record<string, string>;
  color?: string;
  url?: string[];
  changelog?: string;
  bundle?: string;
  source?: "cli" | "pr";
  commitSha?: string;
  changedFiles?: string[];
  metadata?: Record<string, any>;
};

export type PresenceSyncBody = {
  presences?: PresenceSyncEntry[];
  archivedSlugs?: string[];
  catalogSlugs?: string[];
  pr?: string;
  prTitle?: string;
  changes?: string;
};

export type PresenceSyncResult = {
  slug: string;
  version: string;
  changelog: string;
};

export type PresenceSyncResponse = {
  results: PresenceSyncResult[];
  archived: string[];
};

export class PresenceAliasConflictError extends Error {
  constructor(readonly issues: string[]) {
    super(`Presence alias conflict: ${issues.join("; ")}`);
  }
}

const normalizeSlug = (slug: string): string => slug.trim().toLowerCase();

/**
 * Rejects the whole batch before any write when an alias is malformed or
 * already used. Incoming metadata replaces the published one, so an alias
 * moved between presences of the same batch is accepted; archived presences
 * are ignored so a renamed presence can keep its old slug as an alias.
 */
const assertNoAliasConflicts = async (presences: PresenceSyncEntry[]): Promise<void> => {
  if (presences.length === 0) return;

  const incoming: PresenceAliasEntry[] = presences.map((p) => ({
    slug: p.slug,
    metadata: p.metadata
  }));

  const incomingSlugs = new Set(incoming.map((p) => p.slug));
  const published = (await getAllPresenceMetas()).filter((p) => !incomingSlugs.has(p.slug));

  const catalog = [...incoming, ...published];
  const issues = incoming.flatMap((p) => getPresenceAliasIssues(p, catalog).map((issue) => `${p.slug}: ${issue}`));

  if (issues.length > 0) throw new PresenceAliasConflictError(issues);
};

const bumpPatch = (version: string): string => {
  const parts = version.split(".").map(Number);
  parts[2] = (parts[2] || 0) + 1;
  return parts.join(".");
};

export const processPresenceSync = async (body: PresenceSyncBody): Promise<PresenceSyncResponse> => {
  await assertNoAliasConflicts(body.presences ?? []);

  const results: PresenceSyncResult[] = [];
  const seen = new Set<string>();

  for (const p of body.presences ?? []) {
    if (seen.has(p.slug)) continue;

    seen.add(p.slug);

    const currentVersion = await getPresenceVersion(p.slug);

    const author = p.author || (currentVersion ? (await getVersionHistory(p.slug))[0]?.author || "unknown" : "unknown");
    const changelogs = p.changelog
      ? translateChangelog(p.changelog)
      : await generateChangelog({
          type: p.type,
          name: p.name,
          changedFiles: p.changedFiles,
          ...(p.type === "new" ? { descriptions: p.description } : {})
        });
    const changelog = JSON.stringify(changelogs);
    const displayChangelog = changelogs[FALLBACK_LOCALE] || "";
    const publishedAt = new Date();
    const timestamp = publishedAt.getTime();
    const createdAt = publishedAt.toISOString();
    const bundleSizeBytes = p.bundle ? Buffer.byteLength(p.bundle, "utf-8") : undefined;
    const bundleSha256 = p.bundle ? sha256Base64Url(p.bundle) : undefined;
    const firstPublication = p.type === "new" || !currentVersion;
    const version = p.version ?? (firstPublication ? "1.0.0" : bumpPatch(currentVersion));
    const history = {
      changelog,
      author,
      authorGithub: p.authorGithub,
      releaseAuthor: serializeJsonField(p.releaseAuthor),
      releaseContributors: serializeJsonField(p.releaseContributors),
      pr: body.pr,
      source: p.source ?? (body.pr ? ("pr" as const) : ("cli" as const)),
      commitSha: p.commitSha,
      changedFiles: serializeJsonField(p.changedFiles),
      bundleSizeBytes,
      bundleSizeLabel: bundleSizeBytes != null ? formatBytes(bundleSizeBytes) : undefined,
      bundleSha256,
      versionType: p.versionType ?? (firstPublication ? "new" : "patch"),
      aiGeneratedChangelog: false,
      createdAt,
      timestamp
    };

    await savePresenceRelease(p.slug, {
      publication: { version, history },
      addedAt: firstPublication ? publishedAt : undefined,
      updatedAt: publishedAt,
      metadata: p.metadata || {
        slug: p.slug,
        name: p.name,
        author,
        category: p.category || "",
        description: p.description || {},
        color: p.color,
        url: p.url
      },
      archived: false
    });
    results.push({
      slug: p.slug,
      version,
      changelog: displayChangelog
    });
  }

  const toArchive = new Set((body.archivedSlugs ?? []).map(normalizeSlug).filter(Boolean));

  if (body.catalogSlugs) {
    const catalog = new Set(body.catalogSlugs.map(normalizeSlug).filter(Boolean));
    const known = await getAllPresenceSlugs({ includeArchived: true });

    for (const slug of known) {
      if (!catalog.has(slug)) toArchive.add(slug);
    }
  }

  for (const slug of seen) toArchive.delete(slug);

  const archived: string[] = [];

  for (const slug of toArchive) {
    if (await setArchived(slug, true)) archived.push(slug);
  }

  return { results, archived };
};
import { formatBytes } from "@nowly/shared"
import { generateChangelog, translateChangelog } from "@/shared/openai.service"
import { sha256Base64Url } from "@/shared/crypto.service"
import { serializeJsonField } from "./presence.service"
import {
  addVersion, getAllPresenceSlugs, getPresenceStats, getVersionHistory,
  setAdded, setArchived, setPresenceMeta, setUpdated, setVersion,
} from "./presence.repository"

type ReleasePerson = {
  name: string
  github?: string
}

export type PresenceSyncEntry = {
  slug: string
  type: "new" | "modified"
  name: string
  category?: string
  author?: string
  authorGithub?: string
  releaseAuthor?: ReleasePerson
  releaseContributors?: ReleasePerson[]
  version?: string
  versionType?: string
  description?: Record<string, string>
  color?: string
  url?: string[]
  changelog?: string
  bundle?: string
  source?: "cli" | "pr"
  commitSha?: string
  changedFiles?: string[]
  diffSummary?: string
  metadata?: Record<string, any>
}

export type PresenceSyncBody = {
  presences?: PresenceSyncEntry[]
  archivedSlugs?: string[]
  catalogSlugs?: string[]
  pr?: string
  prTitle?: string
  changes?: string
}

export type PresenceSyncResult = {
  slug: string
  version: string
  changelog: string
}

export type PresenceSyncResponse = {
  results: PresenceSyncResult[]
  archived: string[]
}

const normalizeSlug = (slug: string): string => slug.trim().toLowerCase()

const bumpPatch = (version: string): string => {
  const parts = version.split(".").map(Number)
  parts[2] = (parts[2] || 0) + 1
  return parts.join(".")
}

/**
 * Admin presence publish/update pipeline used by the CLI and the PR workflow.
 * For each presence it resolves the next version, generates/translates the
 * changelog, records the version history entry and upserts metadata.
 */
export const processPresenceSync = async (body: PresenceSyncBody): Promise<PresenceSyncResponse> => {
  const results: PresenceSyncResult[] = []
  const seen = new Set<string>()

  for (const p of body.presences ?? []) {
    if (seen.has(p.slug)) continue
    seen.add(p.slug)

    const stats = await getPresenceStats(p.slug)
    const currentVersion = stats.version
    const author = p.author || (stats.version ? (await getVersionHistory(p.slug))[0]?.author || "unknown" : "unknown")
    const aiGeneratedChangelog = !p.changelog
    const changelogs = p.changelog
      ? await translateChangelog(p.changelog)
      : await generateChangelog({
        type: p.type,
        name: p.name,
        changedFiles: p.changedFiles,
        diffSummary: p.diffSummary,
        ...(p.type === "new" ? { descriptions: p.description } : {}),
      })
    const changelog = JSON.stringify(changelogs)
    const displayChangelog = changelogs["en-US"] || ""
    const timestamp = Date.now()
    const createdAt = new Date(timestamp).toISOString()
    const bundleSizeBytes = p.bundle ? Buffer.byteLength(p.bundle, "utf-8") : undefined
    const bundleSha256 = p.bundle ? sha256Base64Url(p.bundle) : undefined
    const versionEntryMeta = {
      changelog,
      author,
      authorGithub: p.authorGithub,
      releaseAuthor: serializeJsonField(p.releaseAuthor),
      releaseContributors: serializeJsonField(p.releaseContributors),
      pr: body.pr,
      source: p.source ?? (body.pr ? "pr" as const : "cli" as const),
      commitSha: p.commitSha,
      changedFiles: serializeJsonField(p.changedFiles),
      bundleSizeBytes,
      bundleSizeLabel: bundleSizeBytes != null ? formatBytes(bundleSizeBytes) : undefined,
      bundleSha256,
      versionType: p.versionType,
      aiGeneratedChangelog,
      createdAt,
      timestamp,
    }

    if (p.type === "new" || !currentVersion) {
      const version = p.version ?? "1.0.0"

      await setVersion(p.slug, version)
      await setAdded(p.slug)
      await addVersion(p.slug, {
        version,
        ...versionEntryMeta,
        versionType: p.versionType ?? "new",
      })

      results.push({ slug: p.slug, version, changelog: displayChangelog })
    } else {
      const nextVersion = p.version ?? bumpPatch(currentVersion)

      await setVersion(p.slug, nextVersion)
      await setUpdated(p.slug)
      await addVersion(p.slug, {
        version: nextVersion,
        ...versionEntryMeta,
        versionType: p.versionType ?? "patch",
      })

      results.push({ slug: p.slug, version: nextVersion, changelog: displayChangelog })
    }

    if (p.metadata) {
      await setPresenceMeta(p.slug, p.metadata as any)
    } else {
      await setPresenceMeta(p.slug, {
        slug: p.slug,
        name: p.name,
        author,
        category: p.category || "",
        description: p.description || {},
        color: p.color,
        url: p.url,
      })
    }

    await setArchived(p.slug, false)
  }

  const toArchive = new Set(
    (body.archivedSlugs ?? []).map(normalizeSlug).filter(Boolean),
  )

  if (body.catalogSlugs) {
    const catalog = new Set(body.catalogSlugs.map(normalizeSlug).filter(Boolean))
    const known = await getAllPresenceSlugs({ includeArchived: true })
    for (const slug of known) {
      if (!catalog.has(slug)) toArchive.add(slug)
    }
  }

  for (const slug of seen) toArchive.delete(slug)

  const archived: string[] = []
  for (const slug of toArchive) {
    if (await setArchived(slug, true)) archived.push(slug)
  }

  return { results, archived }
}

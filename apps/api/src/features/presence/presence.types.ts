export interface PresenceStats {
  totalInstalls: number
  activeUsers: number
  version: string | null
  archived: boolean
  addedAt: string | null
  lastUpdated: string | null
}

export interface GlobalPresenceStats {
  totalUsers: number
  activeUsers: number
  activePresenceCount: number
  installedPresenceCount: number
}

export interface VersionEntry {
  version: string
  changelog: string
  author: string
  authorGithub?: string
  releaseAuthor?: string
  releaseContributors?: string
  pr?: string
  source?: "cli" | "pr"
  commitSha?: string
  changedFiles?: string
  bundleSizeBytes?: number
  bundleSizeLabel?: string
  bundleSha256?: string
  versionType?: string
  aiGeneratedChangelog?: boolean
  createdAt?: string
  timestamp: number
}

export type PresenceMeta = Record<string, any>
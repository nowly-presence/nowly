import { BUNDLED_PRESENCE_SLUGS } from "@/generated/bundled-presence-slugs"
import { CDN_BASE_URL } from "@/shared/constants"

export type PresenceAssetType = "icon" | "logo" | "thumbnail"

const ASSET_FILE: Record<PresenceAssetType, string> = {
  logo: "logo.png",
  icon: "icon.png",
  thumbnail: "thumbnail.jpg",
}

const bundledSlugs = new Set(BUNDLED_PRESENCE_SLUGS)

const localAssetUrl = (slug: string, type: PresenceAssetType): string =>
  chrome.runtime.getURL(`presences/${slug}/assets/${ASSET_FILE[type]}`)

const cdnAssetUrl = (slug: string, type: PresenceAssetType): string =>
  `${CDN_BASE_URL.replace(/\/+$/, "")}/presences/${encodeURIComponent(slug)}/assets/${ASSET_FILE[type]}`

export const presenceAssetsBase = (slug: string): string =>
  bundledSlugs.has(slug) ? chrome.runtime.getURL(`presences/${slug}/assets`) : `${CDN_BASE_URL.replace(/\/+$/, "")}/presences/${encodeURIComponent(slug)}/assets`

export const assetUrl = (slug: string, type: PresenceAssetType): string =>
  bundledSlugs.has(slug) ? localAssetUrl(slug, type) : cdnAssetUrl(slug, type)

export const slugFromFolderName = (name: string): string => name.toLowerCase().replace(/\s+/g, "-")

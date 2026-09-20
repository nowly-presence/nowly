import { BUNDLED_PRESENCE_SLUGS } from "@/generated/bundled-presence-slugs"
import { CDN_BASE_URL } from "@/shared/constants"

const ASSET_EXT: Record<string, string> = {
  logo: ".png",
  icon: ".png",
  thumbnail: ".jpg",
}

const bundledSlugs = new Set(BUNDLED_PRESENCE_SLUGS)

const localAssetUrl = (slug: string, type: "icon" | "logo" | "thumbnail"): string =>
  chrome.runtime.getURL(`presences/${slug}/assets/${type}${ASSET_EXT[type]}`)

const cdnAssetUrl = (slug: string, type: "icon" | "logo" | "thumbnail"): string | undefined => {
  if (!CDN_BASE_URL) return undefined
  return `${CDN_BASE_URL}/presences/${slug}/assets/${type}${ASSET_EXT[type]}`
}

export const assetUrl = (slug: string, type: "icon" | "logo" | "thumbnail"): string => {
  if (bundledSlugs.has(slug)) return localAssetUrl(slug, type)
  return cdnAssetUrl(slug, type) ?? localAssetUrl(slug, type)
}

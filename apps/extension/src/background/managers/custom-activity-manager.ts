import { broadcastActiveTab } from "@/background/managers/activity-manager"
import { deleteCustomAsset, touchCustomAsset, uploadCustomAsset } from "@/background/services/custom-assets-api"
import {
  getActiveCustomActivity,
  getCustomActivities,
  getCustomImages,
  setCustomImages,
  updateCustomActivities,
} from "@/background/storage/custom-activities.store"
import { CUSTOM_ACTIVITIES_MAX, CUSTOM_BUTTONS_MAX, customImageHashes, customImageSync, hasCustomActivityErrors, validateCustomActivity } from "@/shared/custom-activity"
import { decodeImageDataUrl, sha256Hex } from "@/shared/custom-image"
import type { CustomActivitiesState, CustomActivity, CustomActivityDraft, CustomImage } from "@/shared/types"

export type SaveCustomActivityResult = { ok: true; activity: CustomActivity } | { ok: false; error: "INVALID" | "LIMIT_REACHED" | "NOT_FOUND" }
export type UploadCustomImageResult = { ok: true; image: CustomImage } | { ok: false; error: string }

const MISSING_ASSET_STATUSES = new Set([404, 410])

const pruneLocalImages = async (state: CustomActivitiesState): Promise<void> => {
  const used = customImageHashes(state.items)
  const images = await getCustomImages()
  const unused = Object.keys(images).filter((hash) => !used.has(hash))
  if (unused.length === 0) return
  for (const hash of unused) delete images[hash]
  await setCustomImages(images)
  await Promise.all(unused.map(deleteCustomAsset))
}

const normalizeDraft = (draft: CustomActivityDraft): CustomActivityDraft => ({
  ...draft,
  name: draft.name.trim(),
  details: draft.details.trim(),
  state: draft.state.trim(),
  largeText: draft.largeText.trim(),
  smallText: draft.smallText.trim(),
  largeImage: draft.largeImage.kind === "url" ? { kind: "url", url: draft.largeImage.url.trim() } : draft.largeImage,
  smallImage: draft.smallImage.kind === "url" ? { kind: "url", url: draft.smallImage.url.trim() } : draft.smallImage,
  buttons: draft.buttons.slice(0, CUSTOM_BUTTONS_MAX).map((button) => ({ label: button.label.trim(), url: button.url.trim() })),
})

export const saveCustomActivity = async (input: CustomActivityDraft): Promise<SaveCustomActivityResult> => {
  const draft = normalizeDraft(input)
  if (hasCustomActivityErrors(validateCustomActivity(draft))) return { ok: false, error: "INVALID" }
  const current = await getCustomActivities()
  const existing = draft.id ? current.items.find((item) => item.id === draft.id) : undefined
  if (draft.id && !existing) return { ok: false, error: "NOT_FOUND" }
  if (!existing && current.items.length >= CUSTOM_ACTIVITIES_MAX) return { ok: false, error: "LIMIT_REACHED" }

  const now = Date.now()
  const activity: CustomActivity = { ...draft, id: existing?.id ?? crypto.randomUUID(), createdAt: existing?.createdAt ?? now, updatedAt: now }
  const next = await updateCustomActivities((state) => ({
    ...state,
    items: existing ? state.items.map((item) => (item.id === activity.id ? activity : item)) : [activity, ...state.items],
  }))
  await pruneLocalImages(next)
  if (next.activeId === activity.id) {
    await broadcastActiveTab()
    void syncActiveCustomImages()
  }
  return { ok: true, activity }
}

export const deleteCustomActivity = async (id: string): Promise<{ ok: boolean }> => {
  const next = await updateCustomActivities((state) => ({
    items: state.items.filter((item) => item.id !== id),
    activeId: state.activeId === id ? null : state.activeId,
    activatedAt: state.activeId === id ? null : state.activatedAt,
  }))
  await pruneLocalImages(next)
  await broadcastActiveTab()
  return { ok: true }
}

export const setActiveCustomActivity = async (id: string | null): Promise<CustomActivitiesState> => {
  const next = await updateCustomActivities((state) => {
    const exists = id !== null && state.items.some((item) => item.id === id)
    return { ...state, activeId: exists ? id : null, activatedAt: exists ? Date.now() : null }
  })
  await broadcastActiveTab()
  if (next.activeId) void syncActiveCustomImages()
  return next
}

const syncImage = async (image: CustomImage, now: number): Promise<CustomImage> => {
  if (image.kind !== "upload") return image
  const sync = customImageSync(image, now)
  if (sync === "fresh") return image
  if (sync === "touch") {
    const touched = await touchCustomAsset(image.hash)
    if (touched.ok) return { ...image, remoteUrl: touched.url, remoteId: touched.id || image.remoteId, lastUsedAt: now }
    if (!touched.status || !MISSING_ASSET_STATUSES.has(touched.status)) return image
  }
  const stored = (await getCustomImages())[image.hash]
  if (!stored) return image
  const decoded = decodeImageDataUrl(stored.dataUrl)
  if (!decoded.ok) return image
  const uploaded = await uploadCustomAsset(image.hash, decoded.bytes, decoded.mime)
  return uploaded.ok ? { ...image, remoteUrl: uploaded.url, remoteId: uploaded.id || image.remoteId, lastUsedAt: now } : image
}

export const syncActiveCustomImages = async (): Promise<void> => {
  const active = await getActiveCustomActivity()
  if (!active) return
  const now = Date.now()
  const [largeImage, smallImage] = await Promise.all([syncImage(active.activity.largeImage, now), syncImage(active.activity.smallImage, now)])
  if (largeImage === active.activity.largeImage && smallImage === active.activity.smallImage) return
  const changedUrl =
    JSON.stringify([largeImage, smallImage].map((image) => image.kind === "upload" && image.remoteUrl)) !==
    JSON.stringify([active.activity.largeImage, active.activity.smallImage].map((image) => image.kind === "upload" && image.remoteUrl))
  await updateCustomActivities((state) => ({
    ...state,
    items: state.items.map((item) => (item.id === active.activity.id ? { ...item, largeImage, smallImage } : item)),
  }))
  if (changedUrl) await broadcastActiveTab()
}

export const uploadCustomImage = async (dataUrl: string): Promise<UploadCustomImageResult> => {
  const decoded = decodeImageDataUrl(dataUrl)
  if (!decoded.ok) return decoded
  const hash = await sha256Hex(decoded.bytes)
  const uploaded = await uploadCustomAsset(hash, decoded.bytes, decoded.mime)
  if (!uploaded.ok) return { ok: false, error: uploaded.error }
  const images = await getCustomImages()
  images[hash] = { dataUrl, mime: decoded.mime, size: decoded.bytes.length, createdAt: Date.now() }
  await setCustomImages(images)
  return {
    ok: true,
    image: { kind: "upload", hash, mime: decoded.mime, size: decoded.bytes.length, remoteId: uploaded.id, remoteUrl: uploaded.url, lastUsedAt: Date.now() },
  }
}

export const getCustomImageData = async (hashes: string[]): Promise<Record<string, string>> => {
  const images = await getCustomImages()
  return Object.fromEntries(hashes.flatMap((hash) => (images[hash] ? [[hash, images[hash].dataUrl]] : [])))
}

import type {
  CustomActivity,
  CustomActivityDraft,
  CustomActivityIcon,
  CustomActivityType,
  CustomImage,
  CustomImageMime,
  PresencePayload,
} from "@/shared/types"
import { BRAND_ICON_PNG } from "@/shared/brand"
import { WEB_BASE_URL } from "@/shared/constants"

export const CUSTOM_ACTIVITY_SLUG_PREFIX = "custom:"
export const CUSTOM_ACTIVITIES_MAX = 50
export const CUSTOM_TEXT_MIN_LENGTH = 2
export const CUSTOM_TEXT_MAX_LENGTH = 128
export const CUSTOM_BUTTON_LABEL_MAX_LENGTH = 32
export const CUSTOM_BUTTONS_MAX = 2
export const CUSTOM_COUNTDOWN_MIN_MINUTES = 5
export const CUSTOM_COUNTDOWN_MAX_MINUTES = 24 * 60
export const CUSTOM_COUNTDOWN_STEP_MINUTES = 5
export const CUSTOM_COUNTDOWN_PRESETS = [15, 25, 45, 60, 120] as const
export const CUSTOM_ICON_RENDER_VERSION = 1
export const CUSTOM_IMAGE_MAX_BYTES = 1024 * 1024
export const CUSTOM_IMAGE_RETENTION_DAYS = 30
export const CUSTOM_IMAGE_MIMES: readonly CustomImageMime[] = ["image/png", "image/jpeg", "image/webp", "image/gif"]
export const CUSTOM_ACTIVITY_TYPES: readonly CustomActivityType[] = [0, 2, 3, 5]

const DAY_MS = 86_400_000
const MINUTE_MS = 60_000
const SECOND_MS = 1000
const IMAGE_EXPIRY_MARGIN_DAYS = 2

export const CUSTOM_IMAGE_TOUCH_INTERVAL_MS = DAY_MS
export const CUSTOM_IMAGE_EXPIRED_MS = (CUSTOM_IMAGE_RETENTION_DAYS - IMAGE_EXPIRY_MARGIN_DAYS) * DAY_MS

export const CUSTOM_ACTIVITY_COLORS = ["#0891b2", "#4a5560", "#3f7d6b", "#5a6bb0", "#9a6a4a", "#7a5aa6", "#a85a74", "#8a7a3c", "#2f6f8f", "#5f7f3f"] as const

export const CUSTOM_ACTIVITY_ICONS: readonly CustomActivityIcon[] = [
  "gamepad",
  "trophy",
  "code",
  "computer",
  "book",
  "graduation",
  "pencil",
  "brush",
  "palette",
  "camera",
  "film",
  "tv",
  "music",
  "headphone",
  "mic",
  "chat",
  "coffee",
  "restaurant",
  "run",
  "plane",
  "moon",
  "rocket",
  "flask",
  "sparkling",
]

export const customActivitySlug = (id: string): string => `${CUSTOM_ACTIVITY_SLUG_PREFIX}${id}`

export const customActivityIdOf = (slug: string | undefined | null): string | null =>
  slug?.startsWith(CUSTOM_ACTIVITY_SLUG_PREFIX) ? slug.slice(CUSTOM_ACTIVITY_SLUG_PREFIX.length) : null

export const isCustomImageMime = (value: string): value is CustomImageMime => CUSTOM_IMAGE_MIMES.some((mime) => mime === value)

const pick = <T,>(values: readonly T[], random: () => number): T => values[Math.floor(random() * values.length) % values.length]

export const randomIconImage = (random: () => number = Math.random): Extract<CustomImage, { kind: "icon" }> => ({
  kind: "icon",
  color: pick(CUSTOM_ACTIVITY_COLORS, random),
  icon: pick(CUSTOM_ACTIVITY_ICONS, random),
})

const HEX_COLOR = /^#[0-9a-f]{6}$/i

export const isCustomActivityIcon = (value: string): value is CustomActivityIcon => CUSTOM_ACTIVITY_ICONS.some((icon) => icon === value)

export const customIconImageUrl = (icon: CustomActivityIcon, color: string): string =>
  `${WEB_BASE_URL.replace(/\/+$/, "")}/api/activity-icon/${icon}/${color.replace("#", "").toLowerCase()}.png?v=${CUSTOM_ICON_RENDER_VERSION}`

export const emptyCustomActivityDraft = (random: () => number = Math.random): CustomActivityDraft => ({
  name: "",
  type: 0,
  details: "",
  state: "",
  largeImage: randomIconImage(random),
  largeText: "",
  smallImage: { kind: "none" },
  smallText: "",
  timestamp: { mode: "elapsed" },
  buttons: [],
})

export type CustomActivityError = "required" | "tooShort" | "tooLong" | "httpsOnly" | "invalidUrl" | "outOfRange"

export type CustomActivityField =
  | "name"
  | "details"
  | "state"
  | "largeText"
  | "smallText"
  | "largeImage"
  | "smallImage"
  | "countdown"
  | `button${number}Label`
  | `button${number}Url`

export type CustomActivityErrors = Partial<Record<CustomActivityField, CustomActivityError>>

const textError = (value: string, required: boolean, max = CUSTOM_TEXT_MAX_LENGTH): CustomActivityError | undefined => {
  const trimmed = value.trim()
  if (!trimmed) return required ? "required" : undefined
  if (trimmed.length < CUSTOM_TEXT_MIN_LENGTH) return "tooShort"
  if (trimmed.length > max) return "tooLong"
  return undefined
}

export const httpsUrlError = (value: string): CustomActivityError | undefined => {
  const trimmed = value.trim()
  if (!trimmed) return "required"
  try {
    const url = new URL(trimmed)
    if (url.protocol !== "https:") return "httpsOnly"
    return url.hostname.includes(".") ? undefined : "invalidUrl"
  } catch {
    return "invalidUrl"
  }
}

const imageError = (image: CustomImage): CustomActivityError | undefined => {
  if (image.kind === "url") return httpsUrlError(image.url)
  if (image.kind === "icon") return isCustomActivityIcon(image.icon) && HEX_COLOR.test(image.color) ? undefined : "invalidUrl"
  return undefined
}

export const validateCustomActivity = (draft: CustomActivityDraft): CustomActivityErrors => {
  const entries: [CustomActivityField, CustomActivityError | undefined][] = [
    ["name", textError(draft.name, true)],
    ["details", textError(draft.details, false)],
    ["state", textError(draft.state, false)],
    ["largeText", textError(draft.largeText, false)],
    ["smallText", textError(draft.smallText, false)],
    ["largeImage", imageError(draft.largeImage)],
    ["smallImage", imageError(draft.smallImage)],
    [
      "countdown",
      draft.timestamp.mode === "countdown" && (!Number.isFinite(draft.timestamp.minutes) || draft.timestamp.minutes < CUSTOM_COUNTDOWN_MIN_MINUTES || draft.timestamp.minutes > CUSTOM_COUNTDOWN_MAX_MINUTES) ? "outOfRange" : undefined,
    ],
    ...draft.buttons.slice(0, CUSTOM_BUTTONS_MAX).flatMap((button, index): [CustomActivityField, CustomActivityError | undefined][] => [
      [`button${index}Label`, textError(button.label, true, CUSTOM_BUTTON_LABEL_MAX_LENGTH)],
      [`button${index}Url`, httpsUrlError(button.url)],
    ]),
  ]
  return Object.fromEntries(entries.filter((entry): entry is [CustomActivityField, CustomActivityError] => entry[1] !== undefined))
}

export const hasCustomActivityErrors = (errors: CustomActivityErrors): boolean => Object.keys(errors).length > 0

export const customImageUrl = (image: CustomImage): string | undefined => {
  if (image.kind === "url") return image.url.trim() || undefined
  if (image.kind === "upload") return image.remoteUrl
  if (image.kind === "icon") return customIconImageUrl(image.icon, image.color)
  return undefined
}

export const clampCountdown = (minutes: number): number =>
  Math.min(CUSTOM_COUNTDOWN_MAX_MINUTES, Math.max(CUSTOM_COUNTDOWN_MIN_MINUTES, Math.round(minutes)))

const optionalText = (value: string): string | undefined => value.trim() || undefined

export const buildCustomPresence = (activity: CustomActivity | CustomActivityDraft, activatedAt: number): PresencePayload => {
  const start = Math.floor(activatedAt / SECOND_MS)
  const large = customImageUrl(activity.largeImage) ?? BRAND_ICON_PNG
  const small = customImageUrl(activity.smallImage)
  return {
    name: activity.name.trim(),
    details: optionalText(activity.details),
    state: optionalText(activity.state),
    startTime: start,
    endTime: activity.timestamp.mode === "countdown" ? Math.floor((activatedAt + activity.timestamp.minutes * MINUTE_MS) / SECOND_MS) : undefined,
    largeImage: large,
    largeText: optionalText(activity.largeText),
    smallImage: small,
    smallText: small ? optionalText(activity.smallText) : undefined,
    type: activity.type,
    buttons: activity.buttons
      .slice(0, CUSTOM_BUTTONS_MAX)
      .map((button) => ({ label: button.label.trim(), url: button.url.trim() }))
      .filter((button) => button.label && button.url.startsWith("https://")),
  }
}

export type CustomImageSync = "fresh" | "touch" | "upload"

export const customImageSync = (image: CustomImage, now: number): CustomImageSync => {
  if (image.kind !== "upload") return "fresh"
  if (!image.remoteUrl || !image.lastUsedAt || now - image.lastUsedAt >= CUSTOM_IMAGE_EXPIRED_MS) return "upload"
  return now - image.lastUsedAt >= CUSTOM_IMAGE_TOUCH_INTERVAL_MS ? "touch" : "fresh"
}

export const customImageHashes = (activities: Pick<CustomActivity, "largeImage" | "smallImage">[]): Set<string> =>
  new Set(activities.flatMap((activity) => [activity.largeImage, activity.smallImage]).flatMap((image) => (image.kind === "upload" ? [image.hash] : [])))

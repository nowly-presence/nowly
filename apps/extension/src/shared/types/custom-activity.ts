export type CustomActivityType = 0 | 2 | 3 | 5

export type CustomImageMime = "image/png" | "image/jpeg" | "image/webp" | "image/gif"

export type CustomImage =
  | { kind: "none" }
  | { kind: "url"; url: string }
  | { kind: "icon"; icon: CustomActivityIcon; color: string }
  | { kind: "upload"; hash: string; mime: CustomImageMime; size: number; remoteId?: string; remoteUrl?: string; lastUsedAt?: number }

export type CustomTimestamp = { mode: "elapsed" } | { mode: "countdown"; minutes: number }

export type CustomActivityIcon =
  | "gamepad"
  | "trophy"
  | "code"
  | "computer"
  | "book"
  | "graduation"
  | "pencil"
  | "brush"
  | "palette"
  | "camera"
  | "film"
  | "tv"
  | "music"
  | "headphone"
  | "mic"
  | "chat"
  | "coffee"
  | "restaurant"
  | "run"
  | "plane"
  | "moon"
  | "rocket"
  | "flask"
  | "sparkling"

export type CustomActivityButton = { label: string; url: string }

export type CustomActivity = {
  id: string
  name: string
  type: CustomActivityType
  details: string
  state: string
  largeImage: CustomImage
  largeText: string
  smallImage: CustomImage
  smallText: string
  timestamp: CustomTimestamp
  buttons: CustomActivityButton[]
  createdAt: number
  updatedAt: number
}

export type CustomActivityDraft = Omit<CustomActivity, "id" | "createdAt" | "updatedAt"> & { id?: string }

export type CustomActivitiesState = {
  items: CustomActivity[]
  activeId: string | null
  activatedAt: number | null
}

export type StoredCustomImage = { dataUrl: string; mime: CustomImageMime; size: number; createdAt: number }

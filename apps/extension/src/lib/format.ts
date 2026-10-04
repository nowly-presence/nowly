import type { Locale } from "@/shared/locales"
import { LOCALE_LONG_MAP } from "@/shared/locales"

export const pad = (value: number): string => String(value).padStart(2, "0")

export const formatClock = (totalSeconds: number): string => {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

export const formatCompact = (value: number | undefined, locale: Locale): string =>
  new Intl.NumberFormat(LOCALE_LONG_MAP[locale], { notation: "compact", maximumFractionDigits: 1 }).format(value ?? 0)

export const formatTime = (timestamp: number, locale: Locale): string =>
  new Intl.DateTimeFormat(LOCALE_LONG_MAP[locale], { hour: "2-digit", minute: "2-digit" }).format(timestamp)

export const formatDateTime = (timestamp: number, locale: Locale): string =>
  new Intl.DateTimeFormat(LOCALE_LONG_MAP[locale], { dateStyle: "medium", timeStyle: "short" }).format(timestamp)

const RELATIVE_UNITS: ReadonlyArray<[Intl.RelativeTimeFormatUnit, number]> = [
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
]

export const formatRelative = (timestamp: number, now: number, locale: Locale): string => {
  const format = new Intl.RelativeTimeFormat(LOCALE_LONG_MAP[locale], { numeric: "auto" })
  const elapsed = timestamp - now
  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(elapsed) >= size) return format.format(Math.round(elapsed / size), unit)
  }
  return format.format(0, "minute")
}

export const formatDate = (value: string | number | null | undefined, locale: Locale): string | null => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(LOCALE_LONG_MAP[locale], { dateStyle: "medium" }).format(date)
}

export const toMs = (value: number | undefined): number | undefined => {
  if (!value) return undefined
  return value > 10_000_000_000 ? value : value * 1000
}

export const hostnameOf = (value: string): string => {
  try {
    return new URL(value.includes("://") ? value : `https://${value}`).hostname.replace(/^www\./, "")
  } catch {
    return value
  }
}

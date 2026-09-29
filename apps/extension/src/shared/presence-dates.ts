export type PresencePublicationDates = {
  addedAt: string | null
  lastUpdated: string | null
}

export const toIsoDateOrNull = (value: unknown): string | null => {
  if (typeof value !== "string" || !value) return null
  return Number.isNaN(Date.parse(value)) ? null : value
}

export const publicationDates = (source: { addedAt?: unknown; lastUpdated?: unknown }): PresencePublicationDates => ({
  addedAt: toIsoDateOrNull(source.addedAt),
  lastUpdated: toIsoDateOrNull(source.lastUpdated),
})

export const wasUpdatedAfterPublication = ({ addedAt, lastUpdated }: PresencePublicationDates): boolean =>
  Boolean(addedAt && lastUpdated && Date.parse(lastUpdated) > Date.parse(addedAt))

import type { CurrentActivity, InstalledPresences, PresenceCatalogItem, PresenceMetadata, RuntimeLogEntry, StoredPresence } from "@/shared/types"
import type { PreviewScenario } from "@/preview/preview-params"

export type CatalogFixture = PresenceCatalogItem & { likes?: number }

const DAY_MS = 86_400_000
const PREFERRED_INSTALLS = ["youtube", "youtube-music", "netflix", "github", "figma", "twitch", "crunchyroll", "chatgpt"]
const INSTALLED_COUNT = 6
const FALLBACK_INSTALLED_COUNT = 5
const SNOOZED_INDEX = 3

const SAMPLE_SETTINGS: Record<string, unknown> = {
  privacy: {
    type: "boolean",
    default: false,
    label: { "en-US": "Privacy mode", "fr-FR": "Mode privé", "es-ES": "Modo privado" },
    description: { "en-US": "Hide the title you're watching.", "fr-FR": "Masque le titre que vous regardez.", "es-ES": "Oculta el título que estás viendo." },
  },
  showButtons: {
    type: "boolean",
    default: true,
    label: { "en-US": "Show buttons", "fr-FR": "Afficher les boutons", "es-ES": "Mostrar botones" },
    description: { "en-US": "Show a button to open the current page.", "fr-FR": "Affiche un bouton pour ouvrir la page en cours.", "es-ES": "Muestra un botón para abrir la página actual." },
  },
  display: {
    type: "select",
    default: "title",
    label: { "en-US": "Main line", "fr-FR": "Ligne principale", "es-ES": "Línea principal" },
    options: [
      { value: "title", label: { "en-US": "Title", "fr-FR": "Titre", "es-ES": "Título" } },
      { value: "channel", label: { "en-US": "Channel", "fr-FR": "Chaîne", "es-ES": "Canal" } },
    ],
  },
}

const stableHash = (value: string): number => [...value].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 7)

const toLocaleRecord = (value: string | Record<string, string> | undefined): Record<string, string> =>
  typeof value === "object" ? value : { "en-US": value ?? "" }

export const loadCatalogFixture = async (now: number): Promise<CatalogFixture[]> => {
  const items: CatalogFixture[] = await fetch("/__fixtures/catalog.json")
    .then((response) => (response.ok ? response.json() : []))
    .catch(() => [])
  return items.map((item) => {
    const hash = stableHash(item.slug)
    const addedAt = now - (hash % 400) * DAY_MS
    const republished = hash % 3 !== 0
    const lastUpdated = republished ? Math.min(now, addedAt + (hash % 90) * DAY_MS) : addedAt
    return {
      ...item,
      version: `1.${item.slug.length % 5}.${item.slug.charCodeAt(0) % 9}`,
      totalInstalls: 200 + (hash % 9000),
      activeUsers: hash % 4 === 0 ? 0 : hash % 420,
      likes: hash % 800,
      addedAt: new Date(addedAt).toISOString(),
      lastUpdated: new Date(lastUpdated).toISOString(),
    }
  })
}

export const toMetadata = (item: CatalogFixture): PresenceMetadata => ({
  slug: item.slug,
  name: typeof item.name === "string" ? item.name : (item.name?.["en-US"] ?? item.slug),
  author: item.author ?? { name: "Nowly" },
  contributors: item.contributors,
  description: toLocaleRecord(item.description),
  longDescription: typeof item.longDescription === "object" ? item.longDescription : undefined,
  url: item.url ?? [],
  color: item.color ?? "#0891b2",
  category: item.category ?? "other",
  features: item.features,
  version: item.version,
  settings: SAMPLE_SETTINGS,
  locales: item.locales,
})

export const toStoredPresence = (item: CatalogFixture, overrides: Partial<StoredPresence> = {}): StoredPresence => {
  const metadata = toMetadata(item)
  return {
    metadata,
    release: { slug: item.slug, version: metadata.version ?? "1.0.0", metadata, bundle: "", sha256: "", metadataHash: "", signature: "", signedAt: "" },
    enabled: true,
    installedAt: Date.now(),
    ...overrides,
  }
}

export const pickInstalledSlugs = (catalog: CatalogFixture[], scenario: PreviewScenario): string[] => {
  if (scenario === "empty") return []
  const available = new Set(catalog.map((item) => item.slug))
  const preferred = PREFERRED_INSTALLS.filter((slug) => available.has(slug)).slice(0, INSTALLED_COUNT)
  return preferred.length ? preferred : catalog.slice(0, FALLBACK_INSTALLED_COUNT).map((item) => item.slug)
}

export const buildInstalledPresences = (catalog: CatalogFixture[], slugs: string[], now: number): InstalledPresences => {
  const bySlug = new Map(catalog.map((item) => [item.slug, item]))
  return Object.fromEntries(
    slugs.flatMap((slug, index) => {
      const item = bySlug.get(slug)
      if (!item) return []
      return [
        [
          slug,
          toStoredPresence(item, {
            enabled: index !== slugs.length - 1,
            installedAt: now - index * DAY_MS * 3,
            ...(index === SNOOZED_INDEX ? { snoozeUntil: now + 45 * 60_000 } : {}),
          }),
        ],
      ]
    }),
  )
}

export const buildLiveActivity = (slug: string | undefined, presences: InstalledPresences, now: number): CurrentActivity | null => {
  if (!slug || !presences[slug]) return null
  const nowSeconds = Math.floor(now / 1000)
  return {
    slug,
    updatedAt: now,
    presence: {
      name: presences[slug].metadata.name,
      details: "Lo-fi beats to design to",
      state: "Live on Nowly Radio",
      startTime: nowSeconds - 262,
      endTime: nowSeconds + 311,
      largeImage: `/cdn/presences/${slug}/assets/thumbnail.jpg`,
      type: 3,
      buttons: [{ label: "Watch video", url: "https://nowly.me" }],
    },
  }
}

export const buildRuntimeLogs = (firstSlug: string | undefined, presenceCount: number, now: number): RuntimeLogEntry[] => [
  { id: "1", at: now - 60_000, level: "success", type: "native", message: "native connected", payload: { nativeVersion: "1.4.2" } },
  { id: "2", at: now - 50_000, level: "info", type: "api", message: "POST /devices/sync", payload: { presenceCount } },
  { id: "3", at: now - 40_000, level: "success", type: "presence", message: "register presence script", payload: { slug: firstSlug ?? "youtube", version: "1.2.3" } },
  { id: "4", at: now - 20_000, level: "warn", type: "api", message: "GET /presences/:slug failed (update check)", payload: { slug: "netflix", status: 503 } },
]

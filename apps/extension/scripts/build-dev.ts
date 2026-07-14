import react from "@vitejs/plugin-react"
import { createHash } from "crypto"
import "dotenv/config"
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs"
import { dirname, join, resolve } from "path"
import { fileURLToPath } from "url"
import { build } from "vite"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")

// Chrome extension IDs are 16 bytes encoded as base-a-p (a=0…p=15).
// This derives the equivalent Firefox UUID from a Chrome ID so both browsers
// share the same underlying key identity.
const chromeIdToFirefoxUuid = (chromeId: string): string => {
  const hex = Array.from({ length: chromeId.length / 2 }, (_, i) => {
    const hi = chromeId.charCodeAt(i * 2) - 0x61      // 'a' = 0
    const lo = chromeId.charCodeAt(i * 2 + 1) - 0x61
    return (hi * 16 + lo).toString(16).padStart(2, "0")
  }).join("")
  return `{${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}}`
}

const BROWSER = (process.argv[2] ?? "chrome") as "chrome" | "firefox"
const DIST = join(ROOT, "dist", BROWSER)
const WEBSITES_PRESENCES = join(ROOT, "..", "..", "packages", "presences", "dist", "presences")
const GENERATED_DIR = join(ROOT, "src", "generated")

const webBaseUrl = process.env.VITE_WEB_BASE_URL ?? "https://nowly.me"
const apiBaseUrl = process.env.VITE_API_BASE_URL ?? "https://api.nowly.me"
const cdnBaseUrl = process.env.VITE_CDN_BASE_URL ?? ""

const define = {
  "import.meta.env.VITE_WEB_BASE_URL": JSON.stringify(webBaseUrl),
  "import.meta.env.VITE_API_BASE_URL": JSON.stringify(apiBaseUrl),
  "import.meta.env.VITE_CDN_BASE_URL": JSON.stringify(cdnBaseUrl),
  "import.meta.env.BROWSER": JSON.stringify(BROWSER),
}

const buildPage = async (name: string, source = name) => {
  await build({
    root: join(ROOT, "src", source),
    base: "./",
    plugins: [react()],
    define,
    resolve: {
      alias: {
        "@": resolve(ROOT, "src"),
        "@messages": resolve(ROOT, "messages"),
      },
    },
    build: {
      outDir: join(DIST, name),
      emptyOutDir: true,
      rollupOptions: { input: join(ROOT, "src", source, "index.html") },
    },
    configFile: false,
  })
}

const buildScript = async (name: string, entry: string) => {
  await build({
    root: ROOT,
    define,
    resolve: {
      alias: {
        "@": resolve(ROOT, "src"),
        "@messages": resolve(ROOT, "messages"),
      },
    },
    build: {
      outDir: DIST,
      emptyOutDir: false,
      lib: {
        entry,
        formats: ["iife"] as const,
        name: `__presences_${name}`,
        fileName: () => `${name}.js`,
      },
      rollupOptions: {
        external: [],
      },
    },
    configFile: false,
  })
}

const copyManifest = () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, "manifest.json"), "utf-8"))

  // Common mutations for all browsers
  manifest.content_scripts[0].js = ["content.js"]
  manifest.icons = {
    16: "icons/icon16.png",
    48: "icons/icon48.png",
    128: "icons/icon128.png",
  }
  manifest.action.default_icon = { ...manifest.icons }

  if (BROWSER === "firefox") {
    manifest.background = { scripts: ["background.js"] }
    delete manifest.minimum_chrome_version
    // userScripts is an optional-only permission on Firefox — declare it in optional_permissions
    // and request it at runtime (Firefox 136+ MV3 userScripts API).
    manifest.permissions = manifest.permissions
      .filter((p: string) => p !== "userScripts" && p !== "sidePanel")
    manifest.optional_permissions = [...(manifest.optional_permissions ?? []), "userScripts"]
    delete manifest.side_panel
    delete manifest.action.default_popup
    manifest.sidebar_action = {
      default_icon: manifest.icons,
      default_panel: "sidepanel/index.html",
      default_title: "__MSG_extensionName__",
    }
    // The Chromium-only `key` is rejected by Firefox; its ID comes from gecko.id.
    delete manifest.key
    manifest.browser_specific_settings = {
      gecko: {
        id: chromeIdToFirefoxUuid("abbegmindbabanjcabnmcjmamaoffbam"),
        strict_min_version: "136.0",
        // Required by AMO — declare data collection practices.
        // "none" = nothing collected/transmitted. Update if that changes.
        data_collection_permissions: { required: ["none"] },
      },
    }
  } else {
    manifest.background.service_worker = "background.js"
    delete manifest.background.type
    delete manifest.action.default_popup
    manifest.side_panel.default_path = "sidepanel/index.html"
  }

  writeFileSync(join(DIST, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`)
}

const copyStatic = () => {
  mkdirSync(join(DIST, "icons"), { recursive: true })
  for (const size of [16, 48, 128]) {
    copyFileSync(
      join(ROOT, "src", "icons", `icon${size}.png`),
      join(DIST, "icons", `icon${size}.png`),
    )
  }
  cpSync(join(ROOT, "_locales"), join(DIST, "_locales"), { recursive: true })
}

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`
  const object = value as Record<string, unknown>
  return `{${Object.keys(object)
    .filter((key) => object[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`)
    .join(",")}}`
}

const sha256Base64Url = (input: string): string => {
  const hash = createHash("sha256").update(input).digest()
  return hash.toString("base64url")
}

const generateBundledPresences = (): void => {
  const entries: { slug: string; release: any }[] = []

  if (!existsSync(WEBSITES_PRESENCES)) {
    console.warn("  ⚠ No presences found — building extension without bundled presences")
  } else {
    const dirs = readdirSync(WEBSITES_PRESENCES, { withFileTypes: true })
      .filter((d) => d.isDirectory())

    for (const dir of dirs) {
      const slug = dir.name
      const bundlePath = join(WEBSITES_PRESENCES, slug, "bundle.js")
      const metadataPath = join(WEBSITES_PRESENCES, slug, "metadata.json")

      if (!existsSync(bundlePath) || !existsSync(metadataPath)) continue

      const bundle = readFileSync(bundlePath, "utf-8")
      const metadata: Record<string, unknown> = { ...JSON.parse(readFileSync(metadataPath, "utf-8")), slug }

      const settingsPath = join(WEBSITES_PRESENCES, slug, "settings.json")
      if (existsSync(settingsPath)) {
        metadata.settings = JSON.parse(readFileSync(settingsPath, "utf-8"))
      }

      const sha256 = sha256Base64Url(bundle)
      const metadataHash = sha256Base64Url(canonicalJson(metadata))

      entries.push({
        slug,
        release: {
          slug,
          version: metadata.version ?? `0.0.0-dev.${Date.now()}`,
          metadata,
          bundle,
          sha256,
          metadataHash,
          signature: "",
          signedAt: new Date().toISOString(),
        },
      })
    }
  }

  mkdirSync(GENERATED_DIR, { recursive: true })
  writeFileSync(
    join(GENERATED_DIR, "bundled-presences.ts"),
    `// Auto-generated by build-dev.ts — do not edit manually
import type { PresenceRelease } from "@/shared/types"

export interface BundledPresence {
  slug: string
  release: PresenceRelease
}

export const BUNDLED_PRESENCES: BundledPresence[] = ${JSON.stringify(entries, null, 2)}
`,
  )

  console.log(`  ✔ Bundled ${entries.length} presences`)
}

const copyPresenceAssets = (): void => {
  if (!existsSync(WEBSITES_PRESENCES)) return

  const dirs = readdirSync(WEBSITES_PRESENCES, { withFileTypes: true })
    .filter((d) => d.isDirectory())

  let count = 0
  for (const dir of dirs) {
    const slug = dir.name
    const assetsSrc = join(WEBSITES_PRESENCES, slug, "assets")
    if (!existsSync(assetsSrc)) continue

    const assetsDest = join(DIST, "presences", slug, "assets")
    cpSync(assetsSrc, assetsDest, { recursive: true })
    count++
  }

  if (count > 0) console.log(`  ✔ Copied assets for ${count} presences`)
}

await generateBundledPresences()
await buildPage("sidepanel", "entrypoints/sidepanel")
await buildScript("background", join(ROOT, "src", "entrypoints", "background", "index.ts"))
await buildScript("content", join(ROOT, "src", "entrypoints", "content", "index.ts"))
copyManifest()
copyStatic()
copyPresenceAssets()

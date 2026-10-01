import { createHash } from "node:crypto"
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { canonicalJson } from "@nowly/shared"
import { ROOT } from "./config"

const PRESENCES_DIR = join(ROOT, "..", "..", "packages", "presences", "dist", "presences")
const GENERATED_DIR = join(ROOT, "src", "generated")

type BundledEntry = {
  slug: string
  release: {
    slug: string
    version: string
    metadata: Record<string, unknown>
    bundle: string
    sha256: string
    metadataHash: string
    iframeBundle?: string
    iframeSha256?: string
    signature: string
    signedAt: string
  }
}

const sha256Base64Url = (input: string): string => createHash("sha256").update(input).digest().toString("base64url")

const writeGenerated = (entries: BundledEntry[]): void => {
  mkdirSync(GENERATED_DIR, { recursive: true })
  writeFileSync(
    join(GENERATED_DIR, "bundled-presences.ts"),
    `import type { PresenceRelease } from "@/shared/types"\n\nexport type BundledPresence = {\n  slug: string\n  release: PresenceRelease\n}\n\nexport const BUNDLED_PRESENCES: BundledPresence[] = ${JSON.stringify(entries, null, 2)}\n`,
  )
  writeFileSync(
    join(GENERATED_DIR, "bundled-presence-slugs.ts"),
    `export const BUNDLED_PRESENCE_SLUGS: string[] = ${JSON.stringify(entries.map((entry) => entry.slug))}\n`,
  )
}

export const resetBundledPresences = (): void => writeGenerated([])

export const generateBundledPresences = (): void => {
  const entries: BundledEntry[] = []
  if (existsSync(PRESENCES_DIR)) {
    for (const dir of readdirSync(PRESENCES_DIR, { withFileTypes: true }).filter((entry) => entry.isDirectory())) {
      const slug = dir.name
      const bundlePath = join(PRESENCES_DIR, slug, "bundle.js")
      const metadataPath = join(PRESENCES_DIR, slug, "metadata.json")
      if (!existsSync(bundlePath) || !existsSync(metadataPath)) continue
      const bundle = readFileSync(bundlePath, "utf-8")
      const metadata: Record<string, unknown> = { ...JSON.parse(readFileSync(metadataPath, "utf-8")), slug }
      const settingsPath = join(PRESENCES_DIR, slug, "settings.json")
      if (existsSync(settingsPath)) metadata.settings = JSON.parse(readFileSync(settingsPath, "utf-8"))
      const iframeBundlePath = join(PRESENCES_DIR, slug, "iframe.js")
      const iframeBundle = existsSync(iframeBundlePath) ? readFileSync(iframeBundlePath, "utf-8") : undefined
      if (metadata.iframe === true && !iframeBundle) {
        throw new Error(`Built iframe bundle not found for "${slug}"`)
      }
      entries.push({
        slug,
        release: {
          slug,
          version: typeof metadata.version === "string" ? metadata.version : `0.0.0-dev.${Date.now()}`,
          metadata,
          bundle,
          sha256: sha256Base64Url(bundle),
          metadataHash: sha256Base64Url(canonicalJson(metadata)),
          ...(iframeBundle
            ? { iframeBundle, iframeSha256: sha256Base64Url(iframeBundle) }
            : {}),
          signature: "",
          signedAt: new Date().toISOString(),
        },
      })
    }
  }
  writeGenerated(entries)
  console.log(`  Bundled ${entries.length} presences`)
}

export const copyPresenceAssets = (distDir: string): void => {
  if (!existsSync(PRESENCES_DIR)) return
  let count = 0
  for (const dir of readdirSync(PRESENCES_DIR, { withFileTypes: true }).filter((entry) => entry.isDirectory())) {
    const source = join(PRESENCES_DIR, dir.name, "assets")
    if (!existsSync(source)) continue
    cpSync(source, join(distDir, "presences", dir.name, "assets"), { recursive: true })
    count += 1
  }
  if (count > 0) console.log(`  Copied assets for ${count} presences`)
}

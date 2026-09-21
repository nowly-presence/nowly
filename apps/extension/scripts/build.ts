import react from "@vitejs/plugin-react"
import "dotenv/config"
import { cpSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "fs"
import { join } from "path"
import { build } from "vite"
import { copyPresenceAssets, generateBundledPresences, resetBundledPresences } from "./bundle-presences"
import { alias, buildDefine, ROOT } from "./config"
import type { Browser, Channel } from "./config"
import { fetchBrandIcons } from "./fetch-brand-icons"
import { generateManifest } from "./generate-manifest"

const args = process.argv.slice(2)
const browser = (args.find((a) => !a.startsWith("--")) ?? "chrome") as Browser
const channel: Channel = args.includes("--canary") ? "canary" : "stable"
const watch = args.includes("--watch")

if (browser !== "chrome" && browser !== "firefox") {
  throw new Error(`Unknown browser "${browser}". Use chrome or firefox.`)
}

const DIST = join(ROOT, "dist", browser)
const define = buildDefine(browser, channel)

const buildPage = (name: string, source = name) =>
  build({
    root: join(ROOT, "src", source),
    base: "./",
    plugins: [react()],
    define,
    resolve: { alias },
    build: {
      outDir: join(DIST, name),
      emptyOutDir: true,
      rollupOptions: { input: join(ROOT, "src", source, "index.html") },
      watch: watch ? {} : null,
      // Loaded from local disk by the browser, not over the network - the
      // default 500kB budget targets page-load perf, which doesn't apply here.
      chunkSizeWarningLimit: 1000,
    },
    configFile: false,
  })

const buildScript = (name: string, entry: string) =>
  build({
    root: ROOT,
    define,
    resolve: { alias },
    build: {
      outDir: DIST,
      emptyOutDir: false,
      lib: { entry, formats: ["iife"] as const, name: `__nowly_${name}`, fileName: () => `${name}.js` },
      watch: watch ? {} : null,
    },
    configFile: false,
  })

// Canary channel renames the extension in-place so it can be installed
// side-by-side with the stable build during local/dogfood testing.
const applyCanaryLocales = (localesDir: string): void => {
  const names: Record<string, { commandOpenPanel: string; contextMenuPage: string }> = {
    en: { commandOpenPanel: "Open Nowly Canary", contextMenuPage: "Nowly Canary presence for this page" },
    fr: { commandOpenPanel: "Ouvrir Nowly Canary", contextMenuPage: "Présence Nowly Canary pour cette page" },
    es: { commandOpenPanel: "Abrir Nowly Canary", contextMenuPage: "Presencia Nowly Canary para esta página" },
  }
  for (const locale of readdirSync(localesDir, { withFileTypes: true })) {
    if (!locale.isDirectory()) continue
    const messagesPath = join(localesDir, locale.name, "messages.json")
    if (!existsSync(messagesPath)) continue
    const messages = JSON.parse(readFileSync(messagesPath, "utf-8")) as Record<string, { message?: string }>
    messages.extensionName = { message: "Nowly Canary" }
    const localized = names[locale.name]
    if (localized) {
      messages.commandOpenPanel = { message: localized.commandOpenPanel }
      messages.contextMenuPage = { message: localized.contextMenuPage }
    }
    writeFileSync(messagesPath, `${JSON.stringify(messages, null, 2)}\n`)
  }
}

const copyStatic = async () => {
  cpSync(join(ROOT, "_locales"), join(DIST, "_locales"), { recursive: true })
  if (channel === "canary") applyCanaryLocales(join(DIST, "_locales"))
  try {
    await fetchBrandIcons(join(DIST, "icons"), channel === "canary" ? "canary" : "stable")
  } catch (error) {
    console.warn("  ⚠ Could not fetch brand icons from CDN - load the unpacked build anyway.", error)
  }
}

const run = async (): Promise<void> => {
  rmSync(DIST, { recursive: true, force: true })

  if (channel === "canary") generateBundledPresences()
  else resetBundledPresences()

  const { version } = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8")) as { version: string }
  generateManifest(browser, channel, version, DIST)
  await copyStatic()
  if (channel === "canary") copyPresenceAssets(DIST)

  await Promise.all([
    buildPage("sidepanel", "entrypoints/sidepanel"),
    buildScript("background", join(ROOT, "src", "entrypoints", "background", "index.ts")),
    buildScript("content", join(ROOT, "src", "entrypoints", "content", "index.ts")),
  ])

  console.log(watch ? `  ✔ Watching ${browser} (${channel}) - reload the unpacked extension after each rebuild` : `  ✔ Built ${browser} (${channel})`)
}

await run()

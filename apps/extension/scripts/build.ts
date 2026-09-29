import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { cpSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "fs"
import { join } from "path"
import { build } from "vite"
import { copyPresenceAssets, generateBundledPresences, resetBundledPresences } from "./bundle-presences"
import { alias, buildDefine, ROOT } from "./config"
import type { Browser, Channel } from "./config"
import { fetchBrandIcons } from "./fetch-brand-icons"
import { generateManifest } from "./generate-manifest"
import { writeIcons } from "./icons"

const loadEnvFile = (): void => {
  const path = join(ROOT, ".env")
  if (!existsSync(path)) return
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "")
  }
}
loadEnvFile()

const args = process.argv.slice(2)
const browser = (args.find((a) => !a.startsWith("--")) ?? "chrome") as Browser
const channel: Channel = args.includes("--canary") ? "canary" : "stable"
const watch = args.includes("--watch")

if (browser !== "chrome" && browser !== "firefox") throw new Error(`Unknown browser "${browser}". Use chrome or firefox.`)

const DIST = join(ROOT, "dist", browser)
const define = buildDefine(browser, channel)

const buildSidepanel = () =>
  build({
    root: join(ROOT, "src", "entrypoints", "sidepanel"),
    base: "./",
    plugins: [react(), tailwindcss()],
    define,
    resolve: { alias },
    build: {
      outDir: join(DIST, "sidepanel"),
      emptyOutDir: true,
      rollupOptions: { input: join(ROOT, "src", "entrypoints", "sidepanel", "index.html") },
      watch: watch ? {} : null,
      chunkSizeWarningLimit: 1000,
    },
    configFile: false,
    logLevel: "warn",
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
    logLevel: "warn",
  })

const applyCanaryLocales = (localesDir: string): void => {
  for (const locale of readdirSync(localesDir, { withFileTypes: true })) {
    if (!locale.isDirectory()) continue
    const path = join(localesDir, locale.name, "messages.json")
    if (!existsSync(path)) continue
    const messages = JSON.parse(readFileSync(path, "utf-8")) as Record<string, { message: string }>
    messages.extensionName = { message: "Nowly Canary" }
    writeFileSync(path, `${JSON.stringify(messages, null, 2)}\n`)
  }
}

const run = async (): Promise<void> => {
  rmSync(DIST, { recursive: true, force: true })

  if (channel === "canary") generateBundledPresences()
  else resetBundledPresences()

  const { version: packageVersion } = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8")) as { version: string }
  generateManifest(browser, channel, process.env.EXTENSION_VERSION ?? packageVersion, DIST)

  cpSync(join(ROOT, "_locales"), join(DIST, "_locales"), { recursive: true })
  if (channel === "canary") applyCanaryLocales(join(DIST, "_locales"))
  if (channel === "canary") await writeIcons(join(DIST, "icons"), channel)
  else await fetchBrandIcons(join(DIST, "icons"), channel)
  if (channel === "canary") copyPresenceAssets(DIST)

  await Promise.all([
    buildSidepanel(),
    buildScript("background", join(ROOT, "src", "entrypoints", "background", "index.ts")),
    buildScript("content", join(ROOT, "src", "entrypoints", "content", "index.ts")),
  ])

  console.log(
    watch ? `  ✔ Watching ${browser} (${channel}) - reload the unpacked extension after each rebuild` : `  ✔ Built ${browser} (${channel})`,
  )
}

await run()

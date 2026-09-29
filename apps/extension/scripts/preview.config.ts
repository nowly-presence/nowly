import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { existsSync, readdirSync, readFileSync } from "fs"
import { join } from "path"
import { defineConfig, type Plugin } from "vite"
import { alias, buildDefine, ROOT } from "./config"

const PRESENCES_DIR = process.env.NOWLY_PRESENCES_DIR ?? join(ROOT, "..", "..", "packages", "presences", "src")

const slugOf = (name: string) => name.toLowerCase().replace(/\s+/g, "-")

const scanPresences = (): Map<string, string> => {
  const map = new Map<string, string>()
  if (!existsSync(PRESENCES_DIR)) return map
  for (const letter of readdirSync(PRESENCES_DIR, { withFileTypes: true })) {
    if (!letter.isDirectory()) continue
    for (const folder of readdirSync(join(PRESENCES_DIR, letter.name), { withFileTypes: true })) {
      const dir = join(PRESENCES_DIR, letter.name, folder.name)
      if (folder.isDirectory() && existsSync(join(dir, "metadata.json"))) map.set(slugOf(folder.name), dir)
    }
  }
  return map
}

const fixtures = (): Plugin => ({
  name: "nowly-preview-fixtures",
  configureServer(server) {
    const presences = scanPresences()
    server.middlewares.use((req, res, next) => {
      const url = req.url ?? ""
      if (url.startsWith("/__fixtures/catalog.json")) {
        const items = [...presences.entries()].map(([slug, dir]) => {
          const metadata = JSON.parse(readFileSync(join(dir, "metadata.json"), "utf-8"))
          const locales: Record<string, unknown> = {}
          const localesDir = join(dir, "locales")
          if (existsSync(localesDir)) {
            for (const file of readdirSync(localesDir)) locales[file.replace(/\.json$/, "")] = JSON.parse(readFileSync(join(localesDir, file), "utf-8"))
          }
          return { ...metadata, slug, locales }
        })
        res.setHeader("Content-Type", "application/json")
        res.end(JSON.stringify(items))
        return
      }
      const asset = url.match(/^\/cdn\/presences\/([^/]+)\/assets\/(.+?)(\?.*)?$/)
      if (asset) {
        const dir = presences.get(decodeURIComponent(asset[1]))
        const file = dir && join(dir, "assets", decodeURIComponent(asset[2]))
        if (file && existsSync(file)) {
          res.setHeader("Content-Type", file.endsWith(".png") ? "image/png" : "image/jpeg")
          res.end(readFileSync(file))
          return
        }
        res.statusCode = 404
        res.end()
        return
      }
      next()
    })
  },
})

export default defineConfig({
  root: join(ROOT, "src", "preview"),
  plugins: [react(), tailwindcss(), fixtures()],
  resolve: { alias },
  define: {
    ...buildDefine("chrome", "canary"),
    "import.meta.env.VITE_CDN_BASE_URL": JSON.stringify("http://127.0.0.1:5173/cdn"),
    "import.meta.env.VITE_PREVIEW": JSON.stringify("1"),
  },
  server: { port: 5173, host: "127.0.0.1" },
})

// Developer-run helper, not part of the build pipeline. Downloads the Satoshi
// variable woff2 so it can be self-hosted (see src/ui/tokens.css) instead of
// loading it from Fontshare's CDN, which MV3's default extension_pages CSP
// does not reliably allow.
//
// Run once with `pnpm --filter @nowly/extension fetch:font`, review the
// output file, and confirm Fontshare's license permits redistributing the
// font inside a distributed browser extension before committing it.
import { mkdirSync, writeFileSync } from "fs"
import { join } from "path"
import { ROOT } from "./config"

const CSS_URL = "https://api.fontshare.com/v2/css?f[]=satoshi@variable&display=swap"
const DEST_DIR = join(ROOT, "src", "assets", "fonts")

const fetchText = async (url: string): Promise<string> => {
  const res = await fetch(url, { headers: { "user-agent": "NowlyExtensionBuild/1.0" } })
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
  return res.text()
}

const run = async (): Promise<void> => {
  const css = await fetchText(CSS_URL)
  const woff2Url = css.match(/url\((https:\/\/[^)]+\.woff2)\)\s*format\(["']woff2["']\)/)?.[1]
  if (!woff2Url) throw new Error("Could not find a woff2 URL in Fontshare's CSS response.")

  const res = await fetch(woff2Url)
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${woff2Url}`)
  const buffer = Buffer.from(await res.arrayBuffer())

  mkdirSync(DEST_DIR, { recursive: true })
  const dest = join(DEST_DIR, "Satoshi-Variable.woff2")
  writeFileSync(dest, buffer)
  console.log(`  ✔ Saved ${dest} (${(buffer.byteLength / 1024).toFixed(1)} KB)`)
  console.log("  ⚠ Confirm Fontshare's license allows redistribution before committing this file.")
}

await run()

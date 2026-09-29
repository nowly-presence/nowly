import { readdirSync, readFileSync, statSync, writeFileSync } from "fs"
import { join, relative } from "path"
import { zipSync } from "fflate"
import { ROOT } from "./config"

const browsers = (process.argv[2] ?? "all") === "all" ? ["chrome", "firefox"] : [process.argv[2]]
const { version } = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8")) as { version: string }

const collect = (dir: string, base: string, out: Record<string, Uint8Array>): void => {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) collect(path, base, out)
    else out[relative(base, path).replace(/\\/g, "/")] = readFileSync(path)
  }
}

for (const browser of browsers) {
  const dist = join(ROOT, "dist", browser)
  const files: Record<string, Uint8Array> = {}
  collect(dist, dist, files)
  const target = join(ROOT, `nowly-${browser}-${version}.zip`)
  writeFileSync(target, zipSync(files, { level: 9 }))
  console.log(`  ✔ ${relative(ROOT, target)}`)
}

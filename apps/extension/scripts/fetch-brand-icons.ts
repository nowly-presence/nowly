import { mkdirSync, writeFileSync } from "fs"
import { join } from "path"

export const CDN_BRAND = "https://cdn.nowly.me/brand"

const ICONS = [
  { size: 16, url: `${CDN_BRAND}/favicons/favicon-16.png` },
  { size: 48, url: `${CDN_BRAND}/favicons/favicon-48.png` },
  { size: 128, url: `${CDN_BRAND}/favicons/favicon-192.png` },
] as const

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

const fetchBuffer = async (url: string): Promise<Buffer> => {
  let lastError: unknown

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": "NowlyExtensionBuild/1.0" },
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      return Buffer.from(await res.arrayBuffer())
    } catch (error) {
      lastError = error
      if (attempt < 4) await sleep(attempt * 750)
    }
  }

  throw lastError
}

export const fetchBrandIcons = async (destDir: string): Promise<void> => {
  mkdirSync(destDir, { recursive: true })

  await Promise.all(ICONS.map(async ({ size, url }) => {
    const buf = await fetchBuffer(url)
    writeFileSync(join(destDir, `icon${size}.png`), buf)
  }))
}

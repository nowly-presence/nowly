import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import sharp from "sharp"

export const CDN_BRAND = "https://cdn.nowly.me/brand"

type BrandIconVariant = "stable" | "canary"

const iconUrls = (variant: BrandIconVariant) => {
  const folder = variant === "canary" ? `${CDN_BRAND}/favicons/canary` : `${CDN_BRAND}/favicons`
  return [
    { size: 16, url: `${folder}/favicon-16.png`, resizeFrom: undefined },
    { size: 48, url: `${folder}/favicon-48.png`, resizeFrom: undefined },
    { size: 128, url: `${folder}/favicon-192.png`, resizeFrom: 128 },
  ] as const
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => {
  setTimeout(resolve, ms)
})

const fetchBuffer = async (url: string): Promise<Buffer> => {
  let lastError: unknown
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { "user-agent": "NowlyExtensionBuild/1.0" } })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return Buffer.from(await response.arrayBuffer())
    } catch (error) {
      lastError = error
      if (attempt < 4) await sleep(attempt * 750)
    }
  }
  throw lastError
}

export const fetchBrandIcons = async (destDir: string, variant: BrandIconVariant = "stable"): Promise<void> => {
  mkdirSync(destDir, { recursive: true })
  await Promise.all(iconUrls(variant).map(async ({ size, url, resizeFrom }) => {
    const buffer = await fetchBuffer(url)
    const output = resizeFrom ? await sharp(buffer).resize(resizeFrom, resizeFrom).png().toBuffer() : buffer
    writeFileSync(join(destDir, `icon${size}.png`), output)
  }))
}

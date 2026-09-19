import { mkdirSync, writeFileSync } from "fs"
import { join } from "path"
import sharp from "sharp"

export const CDN_BRAND = "https://cdn.nowly.me/brand"

export type BrandIconVariant = "stable" | "canary"

// The CDN only hosts 16/32/48/192 favicons - there is no 128 variant, but the
// store manifests require an exact 128x128 icon, so it's downscaled from 192.
const iconUrls = (variant: BrandIconVariant) => {
  const folder = variant === "canary"
    ? `${CDN_BRAND}/favicons/canary`
    : `${CDN_BRAND}/favicons`

  return [
    { size: 16, url: `${folder}/favicon-16.png`, resizeFrom: undefined },
    { size: 48, url: `${folder}/favicon-48.png`, resizeFrom: undefined },
    { size: 128, url: `${folder}/favicon-192.png`, resizeFrom: 128 },
  ] as const
}

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

export const fetchBrandIcons = async (
  destDir: string,
  variant: BrandIconVariant = "stable",
): Promise<void> => {
  mkdirSync(destDir, { recursive: true })

  await Promise.all(iconUrls(variant).map(async ({ size, url, resizeFrom }) => {
    const buf = await fetchBuffer(url)
    const output = resizeFrom ? await sharp(buf).resize(resizeFrom, resizeFrom).png().toBuffer() : buf
    writeFileSync(join(destDir, `icon${size}.png`), output)
  }))
}

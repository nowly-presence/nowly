import { mkdirSync, writeFileSync } from "fs"
import { join } from "path"
import sharp from "sharp"
import type { Channel } from "./config"

const CDN_BRAND = "https://cdn.nowly.me/brand"

const iconUrls = (channel: Channel) => {
  const folder = channel === "canary" ? `${CDN_BRAND}/favicons/canary` : `${CDN_BRAND}/favicons`
  return [
    { size: 16, url: `${folder}/favicon-16.png` },
    { size: 48, url: `${folder}/favicon-48.png` },
    { size: 128, url: `${folder}/favicon-192.png` },
  ] as const
}

const fetchBuffer = async (url: string): Promise<Buffer> => {
  let lastError: unknown
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": "NowlyExtensionBuild/1.0" } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return Buffer.from(await res.arrayBuffer())
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, attempt * 500))
    }
  }
  throw lastError
}

const fallbackSvg = (channel: Channel): Buffer =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="28" fill="${
      channel === "canary" ? "#CFEE22" : "#0891b2"
    }"/><circle cx="64" cy="64" r="22" fill="${channel === "canary" ? "#07080c" : "#eef5fc"}"/></svg>`,
  )

export const writeIcons = async (destDir: string, channel: Channel): Promise<void> => {
  mkdirSync(destDir, { recursive: true })
  try {
    await Promise.all(
      iconUrls(channel).map(async ({ size, url }) => {
        const buffer = await fetchBuffer(url)
        writeFileSync(join(destDir, `icon${size}.png`), await sharp(buffer).resize(size, size).png().toBuffer())
      }),
    )
  } catch {
    console.warn("  ⚠ Brand icons unreachable on the CDN - using offline placeholder icons")
    const svg = fallbackSvg(channel)
    await Promise.all(
      [16, 48, 128].map(async (size) =>
        writeFileSync(join(destDir, `icon${size}.png`), await sharp(svg).resize(size, size).png().toBuffer()),
      ),
    )
  }
}

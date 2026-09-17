const CDN_BASE_URL = "https://cdn.nowly.me"
const MIME_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
}
const EXTENSIONS = ["png", "jpg", "jpeg"]

export const fetchAssetFromCdn = async (
  slug: string,
  type: string,
): Promise<{ buffer: Buffer; mime: string } | null> => {
  for (const ext of EXTENSIONS) {
    const url = `${CDN_BASE_URL}/presences/${slug}/assets/${type}.${ext}`
    try {
      const res = await fetch(url)
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer())
        return { buffer, mime: MIME_TYPES[ext] ?? "application/octet-stream" }
      }
    } catch {}
  }

  return null
}

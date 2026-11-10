import { CDN_BASE_URL, fetchCdn, isCdnPathSegment } from "@/shared/cdn";

const MIME_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg"
};
const EXTENSIONS = ["png", "jpg", "jpeg"];

export const fetchAssetFromCdn = async (slug: string, type: string): Promise<{
  buffer: Buffer;
  mime: string;
} | null> => {
  if (!isCdnPathSegment(slug) || !isCdnPathSegment(type)) return null;

  for (const ext of EXTENSIONS) {
    const res = await fetchCdn(`${CDN_BASE_URL}/presences/${slug}/assets/${type}.${ext}`);

    if (!res) continue;

    try {
      return {
        buffer: Buffer.from(await res.arrayBuffer()),
        mime: MIME_TYPES[ext] ?? "application/octet-stream"
      };
    } catch (error) {
      console.warn(`CDN body read failed for ${slug}/${type}.${ext}`, error);
    }
  }

  return null;
};
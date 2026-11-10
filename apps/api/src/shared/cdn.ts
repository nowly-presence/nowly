export const CDN_BASE_URL = "https://cdn.nowly.me";

const CDN_PATH_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._+!&'~-]{0,127}$/;

/**
 * Slugs and versions come from request paths and become CDN path segments:
 * anything that could leave its folder (separators, dot segments, query or
 * fragment marks, percent escapes) is refused before a URL is built.
 */
export const isCdnPathSegment = (value: string): boolean => CDN_PATH_SEGMENT.test(value) && !value.includes("..");

export const fetchCdn = async (url: string): Promise<Response | null> => {
  try {
    const response = await fetch(url);

    return response.ok ? response : null;
  } catch (error) {
    console.warn(`CDN fetch failed for ${url}`, error);

    return null;
  }
};

export const fetchCdnFile = async (slug: string, version: string, file: string): Promise<string | null> => {
  if (!isCdnPathSegment(slug) || !isCdnPathSegment(version)) return null;

  const base = `${CDN_BASE_URL}/presences/${slug}`;

  for (const url of [`${base}/versions/${version}/${file}`, `${base}/${file}?v=${encodeURIComponent(version)}`, `${base}/${file}`]) {
    const response = await fetchCdn(url);

    if (response) return response.text();
  }

  return null;
};
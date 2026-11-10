export const CDN_BASE_URL = "https://cdn.nowly.me";

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
  const base = `${CDN_BASE_URL}/presences/${slug}`;

  for (const url of [`${base}/versions/${version}/${file}`, `${base}/${file}?v=${encodeURIComponent(version)}`, `${base}/${file}`]) {
    const response = await fetchCdn(url);

    if (response) return response.text();
  }

  return null;
};
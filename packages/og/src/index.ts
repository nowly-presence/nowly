export const OG_IMAGE_VERSION = "3";

export const ogImageUrl = (path: string, params: {
  title: string;
  description: string;
  badge?: string;
  accent?: string;
  logo?: string;
}): string => {
  const search = new URLSearchParams({
    title: params.title,
    description: params.description,
    v: OG_IMAGE_VERSION
  });

  if (params.badge) search.set("badge", params.badge);
  if (params.accent) search.set("accent", params.accent);
  if (params.logo) search.set("logo", params.logo);

  return `${path}?${search.toString()}`;
};
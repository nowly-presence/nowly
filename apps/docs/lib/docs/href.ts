export const docHref = (slug = ""): string => {
  const trimmed = slug.replace(/^\/+/, "").replace(/^docs\/?/, "");
  return trimmed ? `/${trimmed}` : "/";
};

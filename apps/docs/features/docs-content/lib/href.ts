import { PROJECT_REPOSITORY_URL } from "@/lib/constants";

export const docHref = (slug = ""): string => {
  const trimmed = slug.replace(/^\/+/, "").replace(/^docs\/?/, "");
  return trimmed ? `/${trimmed}` : "/";
};

export const docSourceUrl = (slug: string, locale: string): string => {
  // Per-version changelog content lives in the @nowly/changelog package, not in this app.
  const sourcePath = slug.startsWith("changelog/") ? `packages/changelog/content/${slug.slice("changelog/".length)}` : `apps/docs/content/docs/${slug}`;
  return `${PROJECT_REPOSITORY_URL}/blob/stable/${sourcePath}/${locale}.mdx`;
};
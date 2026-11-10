export const REVIEW_SECTIONS = ["identity", "images", "texts", "pages", "domains"] as const;

export type ReviewSection = (typeof REVIEW_SECTIONS)[number];

export type SectionVerdict = "ok" | "fix" | null;

export const SECTION_FIELD: Record<ReviewSection, string> = {
  identity: "name",
  images: "images",
  texts: "description",
  pages: "page.details",
  domains: "domains"
};
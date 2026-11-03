import type { CreatorDefinition } from "./creator-schema";
import type { CreatorPage } from "./creator-types";

export type CreatorFieldChange = {
  field: string;
  page?: string;
  kind: "added" | "removed" | "changed";
};

const TOP_LEVEL_FIELDS = [
  "name",
  "domains",
  "color",
  "category",
  "baseLocale",
  "translationMode",
  "locales",
  "description",
  "longDescription",
  "features",
  "browsingFallback"
] as const;

const PAGE_FIELDS = ["name", "match", "activityType", "variables", "details", "state", "largeImage", "timestamps", "button"] as const;

const stable = (value: unknown): string =>
  JSON.stringify(value, (_key, item: unknown) =>
    item && typeof item === "object" && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item
  ) ?? "";

const same = (a: unknown, b: unknown): boolean => stable(a) === stable(b);

const pageChanges = (before: CreatorPage | undefined, after: CreatorPage | undefined, label: string): CreatorFieldChange[] => {
  if (!before) return [
    {
      field: "page",
      page: label,
      kind: "added"
    }
  ];
  if (!after) return [
    {
      field: "page",
      page: label,
      kind: "removed"
    }
  ];

  return PAGE_FIELDS.filter((field) => !same(before[field], after[field])).map((field) => ({
    field: `page.${field}`,
    page: label,
    kind: "changed"
  }));
};

export const diffDefinitions = (before: CreatorDefinition | null, after: CreatorDefinition): CreatorFieldChange[] => {
  if (!before) return [
    {
      field: "definition",
      kind: "added"
    }
  ];

  const changes: CreatorFieldChange[] = TOP_LEVEL_FIELDS.filter((field) => !same(before[field], after[field])).map((field) => ({
    field,
    kind: "changed"
  }));

  const previous = new Map(before.pages.map((page) => [page.id, page]));
  const next = new Map(after.pages.map((page) => [page.id, page]));

  for (const page of after.pages) changes.push(...pageChanges(previous.get(page.id), page, page.name));

  for (const page of before.pages) if (!next.has(page.id)) changes.push(...pageChanges(page, undefined, page.name));

  const keptBefore = before.pages.filter((page) => next.has(page.id)).map((page) => page.id);
  const keptAfter = after.pages.filter((page) => previous.has(page.id)).map((page) => page.id);

  if (!same(keptBefore, keptAfter)) changes.push({
    field: "pages.order",
    kind: "changed"
  });

  return changes;
};
import { generatePresenceSource } from "./creator-codegen";
import { presenceFolder } from "./creator-draft";
import { buildLocaleFiles, buildMetadata } from "./creator-files";
import type { CreatorDraft } from "./creator-types";

export type CreatorTextFile = {
  path: string;
  content: string;
};

export const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

export const creatorDefinition = (draft: CreatorDraft): Omit<CreatorDraft, "assets" | "submission"> => {
  const { assets: _assets, submission: _submission, ...definition } = draft;
  return definition;
};

export const buildTextFiles = (draft: CreatorDraft): CreatorTextFile[] => {
  const folder = presenceFolder(draft.name);
  const locales = buildLocaleFiles(draft);
  return [
    {
      path: `${folder}/metadata.json`,
      content: json(buildMetadata(draft))
    },
    {
      path: `${folder}/presence.ts`,
      content: generatePresenceSource(draft)
    },
    ...Object.entries(locales).map(([locale, strings]) => ({
      path: `${folder}/locales/${locale}.json`,
      content: json(strings)
    }))
  ];
};
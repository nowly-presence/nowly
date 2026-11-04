import { generatePresenceSource, generateSettingsSource } from "./creator-codegen";
import { presenceFolder } from "./creator-draft";
import { buildLocaleFiles, buildMetadata } from "./creator-files";
import type { CreatorDraft } from "./creator-types";

export type CreatorTextFile = {
  path: string;
  content: string;
};

export const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

export const creatorDefinition = (draft: CreatorDraft): Omit<CreatorDraft, "assets" | "submission" | "sentSignature"> => {
  const { assets: _assets, submission: _submission, sentSignature: _signature, ...definition } = draft;
  return definition;
};

export const buildTextFiles = (draft: CreatorDraft): CreatorTextFile[] => {
  const folder = presenceFolder(draft.name);
  const locales = buildLocaleFiles(draft);
  const settings = generateSettingsSource(draft);
  return [
    {
      path: `${folder}/metadata.json`,
      content: json(buildMetadata(draft))
    },
    {
      path: `${folder}/presence.ts`,
      content: generatePresenceSource(draft)
    },
    ...(settings
      ? [
          {
            path: `${folder}/settings.ts`,
            content: settings
          }
        ]
      : []),
    ...Object.entries(locales).map(([locale, strings]) => ({
      path: `${folder}/locales/${locale}.json`,
      content: json(strings)
    }))
  ];
};
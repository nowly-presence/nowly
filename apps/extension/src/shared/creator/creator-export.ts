import { strToU8, zipSync } from "fflate";
import { generatePresenceSource } from "@/shared/creator/creator-codegen";
import { presenceFolder } from "@/shared/creator/creator-draft";
import { buildLocaleFiles, buildMetadata } from "@/shared/creator/creator-files";
import type { CreatorDraft } from "@/shared/creator/creator-types";
import { base64ToBytes } from "@/shared/zip-bytes";

export type CreatorTextFile = {
  path: string;
  content: string;
};

const DATA_URL = /^data:[^;]+;base64,(.+)$/;

export const dataUrlToBytes = (dataUrl: string): Uint8Array | null => {
  const match = DATA_URL.exec(dataUrl);
  return match ? base64ToBytes(match[1]) : null;
};

const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

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

export const buildCreatorZip = (draft: CreatorDraft): Uint8Array => {
  const folder = presenceFolder(draft.name);
  const entries: Record<string, Uint8Array> = Object.fromEntries(
    buildTextFiles(draft).map((file) => [
      file.path,
      strToU8(file.content)
    ])
  );
  const assets: [string, string | undefined][] = [
    ["logo.png", draft.assets.logo],
    ["icon.png", draft.assets.icon],
    ["thumbnail.jpg", draft.assets.thumbnail]
  ];

  for (const [name, dataUrl] of assets) {
    const bytes = dataUrl ? dataUrlToBytes(dataUrl) : null;
    if (bytes) entries[`${folder}/assets/${name}`] = bytes;
  }

  entries["creator.json"] = strToU8(json(creatorDefinition(draft)));
  return zipSync(entries, { level: 6 });
};
import { strToU8, zipSync } from "fflate";
import { buildTextFiles, creatorDefinition, json } from "@nowly/presence-creator/creator-export";
import { presenceFolder } from "@nowly/presence-creator/creator-draft";
import type { CreatorDraft } from "@nowly/presence-creator/creator-types";
import { base64ToBytes } from "@/shared/zip-bytes";

const DATA_URL = /^data:[^;]+;base64,(.+)$/;
const ZIP_LEVEL = 6;

export const dataUrlToBytes = (dataUrl: string): Uint8Array | null => {
  const match = DATA_URL.exec(dataUrl);
  return match ? base64ToBytes(match[1]) : null;
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
  return zipSync(entries, { level: ZIP_LEVEL });
};
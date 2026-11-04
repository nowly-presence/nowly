import { buildTextFiles } from "@nowly/presence-creator/creator-export";
import type { CreatorDraft } from "@nowly/presence-creator/creator-types";

const HASH_SEED = 5381;
const HASH_SHIFT = 5;

const hashText = (value: string, seed: number): number => {
  let hash = seed;

  for (let index = 0; index < value.length; index++) hash = ((hash << HASH_SHIFT) + hash + value.charCodeAt(index)) | 0;

  return hash >>> 0;
};

export const creatorSignature = (draft: CreatorDraft): string => {
  const { logo, icon, thumbnail } = draft.assets;
  const content = JSON.stringify([
    buildTextFiles(draft),
    logo ?? "",
    icon ?? "",
    thumbnail ?? "",
    draft.color,
    draft.translationMode
  ]);
  return `${content.length.toString(36)}-${hashText(content, HASH_SEED).toString(36)}`;
};
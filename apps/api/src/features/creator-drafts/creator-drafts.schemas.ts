import { z } from "zod";

export const CREATOR_DRAFT_BODY_LIMIT = 4 * 1024 * 1024;
export const CREATOR_DRAFT_MAX_BYTES = 3 * 1024 * 1024;
export const CREATOR_DRAFTS_MAX = 20;
export const CREATOR_DRAFT_ID_PATTERN = /^[A-Za-z0-9]{8}$/;

export const DraftIdSchema = z.string().regex(CREATOR_DRAFT_ID_PATTERN);

export const DraftPutBodySchema = z.object({
  updatedAt: z.number().int().positive(),
  value: z.looseObject({
    id: z.string(),
    updatedAt: z.number().int().positive()
  })
});

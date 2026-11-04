import type { AppEnv } from "@/context";
import { accountOf, requireExtensionToken } from "@/features/account/extension-token.middleware";
import { limitBody } from "@/middleware/body-limit";
import { jsonBody } from "@/shared/request-body";
import { Hono } from "hono";
import { CREATOR_DRAFT_BODY_LIMIT, DraftIdSchema, DraftPutBodySchema } from "./creator-drafts.schemas";
import { deleteDraft, getDraft, listDraftIndex, putDraft } from "./creator-drafts.service";

const STATUS = {
  DRAFT_TOO_LARGE: 413,
  TOO_MANY_DRAFTS: 409,
  DRAFT_ID_MISMATCH: 422,
  DRAFT_CONFLICT: 409
} as const;

export const creatorDraftRoutes = new Hono<AppEnv>()
  .get("/me/creator-drafts", requireExtensionToken("creator"), async (c) => {
    c.header("Cache-Control", "no-store");
    return c.json({ items: await listDraftIndex(accountOf(c).userId) });
  })
  .get("/me/creator-drafts/:id", requireExtensionToken("creator"), async (c) => {
    const id = DraftIdSchema.safeParse(c.req.param("id"));

    if (!id.success) return c.json({ error: "INVALID_DRAFT_ID" }, 400);

    const draft = await getDraft(accountOf(c).userId, id.data);

    if (!draft) return c.json({ error: "DRAFT_NOT_FOUND" }, 404);

    c.header("Cache-Control", "no-store");
    return c.json(draft);
  })
  .put("/me/creator-drafts/:id", requireExtensionToken("creator"), limitBody(CREATOR_DRAFT_BODY_LIMIT), async (c) => {
    const id = DraftIdSchema.safeParse(c.req.param("id"));
    const body = DraftPutBodySchema.safeParse(await jsonBody(c));

    if (!id.success || !body.success) return c.json({ error: "INVALID_REQUEST_BODY" }, 400);

    const result = await putDraft({
      userId: accountOf(c).userId,
      draftId: id.data,
      updatedAt: body.data.updatedAt,
      value: body.data.value
    });

    if (result.ok) return c.json({ updatedAt: result.updatedAt });

    return c.json(
      {
        error: result.error,
        ...(result.error === "DRAFT_CONFLICT" ? { updatedAt: result.updatedAt } : {})
      },
      STATUS[result.error]
    );
  })
  .delete("/me/creator-drafts/:id", requireExtensionToken("creator"), async (c) => {
    const id = DraftIdSchema.safeParse(c.req.param("id"));

    if (!id.success) return c.json({ error: "INVALID_DRAFT_ID" }, 400);

    return c.json({ updatedAt: await deleteDraft(accountOf(c).userId, id.data) });
  });

import type { AppEnv } from "@/context";
import { accountOf, requireExtensionToken } from "@/features/account/extension-token.middleware";
import { revokeUserExtensionTokens } from "@/features/account/extension-token.service";
import { jsonBody } from "@/shared/request-body";
import { isSyncDocumentKey } from "@nowly/shared";
import { syncChangesQuerySchema, syncPutBodySchema } from "@nowly/shared/schemas";
import { Hono } from "hono";
import { deleteSyncDocuments, listSyncDocuments, putSyncDocument, validateSyncValue } from "./sync.service";

export const syncRoutes = new Hono<AppEnv>()
  .use(requireExtensionToken("sync"))
  .get("/", async (c) => {
    const serverTime = new Date().toISOString();
    return c.json({
      documents: await listSyncDocuments(accountOf(c).userId),
      serverTime
    });
  })
  .get("/changes", async (c) => {
    const parsed = syncChangesQuerySchema.safeParse(c.req.query());

    if (!parsed.success) return c.json({ error: "INVALID_SINCE" }, 400);

    const serverTime = new Date().toISOString();
    return c.json({
      documents: await listSyncDocuments(accountOf(c).userId, new Date(parsed.data.since)),
      serverTime
    });
  })
  .put("/:key", async (c) => {
    const key = c.req.param("key");

    if (!isSyncDocumentKey(key)) return c.json({ error: "UNKNOWN_SYNC_KEY" }, 404);

    const parsed = syncPutBodySchema.safeParse(await jsonBody(c));

    if (!parsed.success) return c.json({ error: "INVALID_REQUEST_BODY" }, 400);

    const validation = validateSyncValue(key, parsed.data.value);

    if (!validation.ok) return c.json({ error: validation.error }, validation.status);

    const account = accountOf(c);
    const result = await putSyncDocument({
      userId: account.userId,
      key,
      value: validation.value,
      baseVersion: parsed.data.baseVersion,
      deviceId: account.deviceId
    });

    if (result.ok) return c.json({
      version: result.version,
      updatedAt: result.updatedAt
    });

    return c.json(
      {
        error: "VERSION_CONFLICT",
        value: result.current?.value ?? null,
        version: result.current?.version ?? 0,
        updatedAt: result.current?.updatedAt ?? null
      },
      409
    );
  })
  .delete("/", async (c) => {
    const { userId } = accountOf(c);
    const deleted = await deleteSyncDocuments(userId);
    await revokeUserExtensionTokens(userId);
    return c.json({
      ok: true,
      deleted
    });
  });
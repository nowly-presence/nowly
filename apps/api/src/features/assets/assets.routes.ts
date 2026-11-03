import { Hono } from "hono";
import { fetchAssetFromCdn } from "./assets.service";

const ASSET_TYPES = ["logo", "icon", "thumbnail"];

export const assetsRoutes = new Hono().get("/:slug/assets/:type", async (c) => {
  const slug = c.req.param("slug").toLowerCase();
  const type = c.req.param("type");

  if (!ASSET_TYPES.includes(type)) return c.json({ error: "INVALID_ASSET_TYPE" }, 400);

  const asset = await fetchAssetFromCdn(slug, type);

  if (!asset) return c.json({ error: "ASSET_NOT_FOUND" }, 404);

  return c.body(new Uint8Array(asset.buffer), 200, {
    "Content-Type": asset.mime,
    "Cache-Control": "public, max-age=31536000, immutable"
  });
});
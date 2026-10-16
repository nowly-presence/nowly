import { serverEnv } from "@nowly/env/server";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { requireDeviceAccess } from "@/features/device/device-token";
import {
  CUSTOM_IMAGE_MAX_BYTES,
  checkUpload,
  cleanupExpiredCustomAssets,
  isCustomImageMime,
  putCustomAsset,
  removeCustomAsset,
  touchCustomAsset,
} from "./custom-assets.service";

const IMAGE_MIMES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

type AssetParams = { deviceId: string; sha256: string };

const deviceKey = (request: FastifyRequest): string =>
  (request.params as AssetParams).deviceId.trim();

export const customAssetsRoutes = async (fastify: FastifyInstance) => {
  for (const mime of IMAGE_MIMES) {
    fastify.addContentTypeParser(
      mime,
      { parseAs: "buffer", bodyLimit: CUSTOM_IMAGE_MAX_BYTES },
      (_request, body, done) => {
        done(null, body);
      },
    );
  }

  fastify.put<{ Params: AssetParams }>(
    "/:deviceId/custom-assets/:sha256",
    {
      bodyLimit: CUSTOM_IMAGE_MAX_BYTES,
      config: {
        rateLimit: { max: 20, timeWindow: "1 hour", keyGenerator: deviceKey },
      },
    },
    async (request, reply) => {
      const deviceId = deviceKey(request);
      if (!requireDeviceAccess(request, reply, deviceId)) return;

      const sha256 = request.params.sha256.toLowerCase();
      const bytes = request.body;
      if (!Buffer.isBuffer(bytes))
        return reply.status(415).send({ error: "UNSUPPORTED_IMAGE" });

      const mime =
        (request.headers["content-type"] ?? "").split(";")[0]?.trim() ?? "";
      if (!isCustomImageMime(mime))
        return reply.status(415).send({ error: "UNSUPPORTED_IMAGE" });

      const check = checkUpload(bytes, mime, sha256);
      if (!check.ok)
        return reply.status(check.status).send({ error: check.error });

      const asset = await putCustomAsset(deviceId, sha256, mime, bytes);
      if (!asset)
        return reply.status(503).send({ error: "DATABASE_UNAVAILABLE" });
      return reply.status(200).send(asset);
    },
  );

  fastify.post<{ Params: AssetParams }>(
    "/:deviceId/custom-assets/:sha256/touch",
    async (request, reply) => {
      const deviceId = deviceKey(request);
      if (!requireDeviceAccess(request, reply, deviceId)) return;

      const asset = await touchCustomAsset(
        deviceId,
        request.params.sha256.toLowerCase(),
      );
      if (!asset)
        return reply.status(404).send({ error: "CUSTOM_ASSET_NOT_FOUND" });
      return asset;
    },
  );

  fastify.delete<{ Params: AssetParams }>(
    "/:deviceId/custom-assets/:sha256",
    async (request, reply) => {
      const deviceId = deviceKey(request);
      if (!requireDeviceAccess(request, reply, deviceId)) return;

      await removeCustomAsset(deviceId, request.params.sha256.toLowerCase());
      return reply.status(204).send();
    },
  );
};

export const customAssetsCronRoutes = async (fastify: FastifyInstance) => {
  const requireCronAuth = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const secret = serverEnv.CUSTOM_ASSETS_CRON_SECRET;
    if (!secret || request.headers.authorization !== `Bearer ${secret}`) {
      reply.status(401).send({ error: "UNAUTHORIZED" });
    }
  };

  fastify.post(
    "/custom-assets/cleanup",
    { preHandler: requireCronAuth },
    async () => {
      const removed = await cleanupExpiredCustomAssets();
      return { removed };
    },
  );
};
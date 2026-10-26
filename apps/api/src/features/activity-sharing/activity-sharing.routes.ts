import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { PUBLICATION_MAX_BYTES, publicationIdSchema, publicationWriteSchema, publicationReserveSchema } from "@nowly/shared/activity-publication";
import { hasDatabase } from "@/db/client";
import { accountOf, requireExtensionToken } from "@/features/account/extension-token.middleware";
import { ownedPublication, readPublication, reservePublication, unpublishActivity, writePublication } from "./activity-sharing.service";

export const activitySharingRoutes = async (fastify: FastifyInstance) => {
  fastify.post<{
    Params: {
      key: string;
    };
  }>(
    "/me/activity-publications/:key",
    {
      preHandler: requireExtensionToken("creator"),
      bodyLimit: PUBLICATION_MAX_BYTES,
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute"
        }
      }
    },
    async (request, reply) => {
      const body = publicationReserveSchema.safeParse(request.body);
      const key = z.string().uuid().safeParse(request.params.key);

      if (!body.success || !key.success) return reply.status(400).send({ error: "INVALID_REQUEST" });

      return reservePublication(accountOf(request).userId, key.data, body.data.activity);
    }
  );
  fastify.get<{
    Params: {
      key: string;
    };
  }>("/me/activity-publications/:key", { preHandler: requireExtensionToken("creator") }, async (request, reply) => {
    reply.header("Cache-Control", "no-store");
    const key = z.string().uuid().safeParse(request.params.key);

    if (!key.success) return reply.status(400).send({ error: "INVALID_REQUEST" });

    return {
      publication: await ownedPublication(accountOf(request).userId, key.data)
    };
  });
  fastify.get<{
    Params: {
      id: string;
    };
  }>(
    "/activity-publications/:id",
    {
      config: {
        rateLimit: {
          max: 60,
          timeWindow: "1 minute"
        }
      }
    },
    async (request, reply) => {
      reply.header("Cache-Control", "no-store");

      if (!hasDatabase()) return reply.status(503).send({ error: "DATABASE_UNAVAILABLE" });

      const id = publicationIdSchema.safeParse(request.params.id);

      if (!id.success) return reply.status(404).send({ error: "NOT_FOUND" });

      return readPublication(id.data);
    }
  );
  fastify.put<{
    Params: {
      key: string;
    };
  }>(
    "/me/activity-publications/:key",
    {
      preHandler: requireExtensionToken("creator"),
      bodyLimit: PUBLICATION_MAX_BYTES,
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute"
        }
      }
    },
    async (request, reply) => {
      const body = publicationWriteSchema.safeParse(request.body);
      const key = z.string().uuid().safeParse(request.params.key);

      if (!body.success || !key.success) return reply.status(400).send({ error: "INVALID_REQUEST" });

      return writePublication(accountOf(request).userId, key.data, body.data.activity, body.data.baseRevision, body.data.id);
    }
  );
  fastify.delete<{
    Params: {
      id: string;
    };
  }>(
    "/me/activity-publications/:id",
    {
      preHandler: requireExtensionToken("creator"),
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute"
        }
      }
    },
    async (request, reply) => {
      const body = z.object({ baseRevision: z.number().int().nonnegative() }).strict().safeParse(request.body);
      const id = publicationIdSchema.safeParse(request.params.id);

      if (!body.success || !id.success) return reply.status(400).send({ error: "INVALID_REQUEST" });

      return unpublishActivity(accountOf(request).userId, id.data, body.data.baseRevision);
    }
  );
};
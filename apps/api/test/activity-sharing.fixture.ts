import Fastify from "fastify";
import { vi } from "vitest";
import { ApiError } from "@/shared/errors";

const publicationDb = vi.hoisted(() => ({
  available: true,
  user: { update: vi.fn() },
  account: { findFirst: vi.fn() },
  extensionToken: {
    findUnique: vi.fn(),
    update: vi.fn()
  },
  activityPublication: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn()
  },
  $transaction: vi.fn()
}));

export { publicationDb };

vi.mock("@/db/client", () => ({
  hasDatabase: () => publicationDb.available,
  getPrisma: () => publicationDb
}));
vi.mock("@/features/auth/better-auth", () => ({
  getAuth: () => ({
    api: {
      getSession: async () => null
    }
  })
}));

export const PUBLIC_ID = "a".repeat(32);
export const LOCAL_KEY = "8b3f2e7c-5a0d-4c1e-9f6b-2d7a1c3e4f50";
export const PUBLISHER_AUTH = { authorization: "Bearer nxt_fixture" };
export const PORTABLE_ACTIVITY = {
  name: "Study time",
  type: 0 as const,
  details: "Reading books",
  state: "",
  largeImage: { kind: "none" as const },
  largeText: "",
  smallImage: { kind: "none" as const },
  smallText: "",
  timestamp: { mode: "elapsed" as const },
  buttons: []
};

export const publisherToken = (scopes = ["creator"]) => ({
  id: "token",
  userId: "verified-owner",
  deviceId: null,
  scopes,
  revokedAt: null,
  expiresAt: new Date(Date.now() + 60_000),
  lastUsedAt: new Date()
});

export const resetPublicationDb = () => {
  vi.clearAllMocks();
  publicationDb.available = true;
  publicationDb.extensionToken.findUnique.mockResolvedValue(publisherToken());
  publicationDb.account.findFirst.mockResolvedValue({ id: "discord-account" });
  publicationDb.activityPublication.findUnique.mockResolvedValue(null);
  publicationDb.activityPublication.count.mockResolvedValue(0);
  publicationDb.activityPublication.create.mockImplementation(async ({ data }) => ({
    ...data,
    revision: data.revision ?? 1
  }));
  publicationDb.activityPublication.updateMany.mockResolvedValue({ count: 1 });
  publicationDb.$transaction.mockImplementation(async (run) => run(publicationDb));
};

export const publicationTestApp = async () => {
  const { activitySharingRoutes } = await import("@/features/activity-sharing/activity-sharing.routes");

  const app = Fastify();
  app.setErrorHandler((error, _request, reply) => {
    const status = error instanceof ApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : "INTERNAL_ERROR";
    return reply.status(status).send({ error: message });
  });
  await app.register(activitySharingRoutes);
  return app;
};
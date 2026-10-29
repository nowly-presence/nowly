import { afterEach, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({
  presence: { findMany: vi.fn().mockResolvedValue([]) },
  devicePresence: { groupBy: vi.fn().mockResolvedValue([]) },
  presenceActiveDevice: {
    groupBy: vi.fn().mockResolvedValue([]),
    deleteMany: vi.fn()
  },
  presenceLike: { groupBy: vi.fn().mockResolvedValue([]) }
}));

vi.mock("@/db/client", () => ({
  getPrisma: () => prisma
}));

afterEach(() => vi.useRealTimers());

it("lists presences with four bulk reads and excludes stale activity without a blocking delete", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-29T12:00:00Z"));
  const { getPresenceListData } = await import("@/features/presence/presence.repository");
  expect(await getPresenceListData()).toEqual([]);
  expect(prisma.presence.findMany).toHaveBeenCalledOnce();
  expect(prisma.devicePresence.groupBy).toHaveBeenCalledOnce();
  expect(prisma.presenceLike.groupBy).toHaveBeenCalledOnce();
  expect(prisma.presenceActiveDevice.groupBy).toHaveBeenCalledExactlyOnceWith({
    by: ["slug"],
    where: {
      lastSeenAt: { gte: new Date("2026-10-29T11:48:00Z") }
    },
    _count: { _all: true }
  });
  expect(prisma.presenceActiveDevice.deleteMany).not.toHaveBeenCalled();
});
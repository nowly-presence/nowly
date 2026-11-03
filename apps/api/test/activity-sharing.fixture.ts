import { activityPublication } from "@nowly/database/schema/activity";
import { account } from "@nowly/database/schema/auth";
import { eq } from "drizzle-orm";
import { vi } from "vitest";
import { createTestDatabase, seedExtensionToken, seedUser, type TestDatabase } from "./database";
import { inject, mount, type InjectResponse } from "./http";

vi.mock("@/features/auth/better-auth", () => ({
  getAuth: () => ({
    api: {
      getSession: async () => null
    }
  })
}));

export const OWNER_ID = "verified-owner";
export const PUBLIC_ID = "a".repeat(32);
export const LOCAL_KEY = "8b3f2e7c-5a0d-4c1e-9f6b-2d7a1c3e4f50";
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

export type PublicationFixture = {
  database: TestDatabase;
  auth: Record<string, string>;
  request: (options: Parameters<typeof inject>[1] | string) => Promise<InjectResponse>;
  seedPublication: (values?: Partial<typeof activityPublication.$inferInsert>) => Promise<void>;
  storedPublication: () => Promise<typeof activityPublication.$inferSelect | undefined>;
  tokenFor: (userId: string, scopes?: Array<"sync" | "creator">) => Promise<Record<string, string>>;
};

export const createPublicationFixture = async (): Promise<PublicationFixture> => {
  const database = await createTestDatabase();

  const { activitySharingRoutes } = await import("@/features/activity-sharing/activity-sharing.routes");

  const app = mount("/", activitySharingRoutes);

  const tokenFor = async (userId: string, scopes: Array<"sync" | "creator"> = ["creator"]) => ({
    authorization: `Bearer ${await seedExtensionToken({ userId, scopes })}`
  });

  const fixture: PublicationFixture = {
    database,
    auth: {},
    request: (options) => inject(app, typeof options === "string" ? { url: options } : options),
    seedPublication: async (values = {}) => {
      await database.db.insert(activityPublication).values({
        id: PUBLIC_ID,
        userId: OWNER_ID,
        localKey: LOCAL_KEY,
        activity: PORTABLE_ACTIVITY,
        ...values
      });
    },
    storedPublication: async () => (await database.db.select().from(activityPublication).where(eq(activityPublication.id, PUBLIC_ID)))[0],
    tokenFor
  };

  return fixture;
};

export const resetPublicationFixture = async (fixture: PublicationFixture) => {
  await fixture.database.reset();
  await seedUser(fixture.database.db, OWNER_ID);
  await fixture.database.db.insert(account).values({
    id: "discord-account",
    userId: OWNER_ID,
    accountId: "1234",
    providerId: "discord"
  });
  fixture.auth = await fixture.tokenFor(OWNER_ID);
};
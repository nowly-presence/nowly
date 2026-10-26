import { vi } from "vitest";
import { setAccount } from "@/background/storage/account.store";
import { setCustomActivities } from "@/background/storage/custom-activities.store";
import { emptyCustomActivityDraft } from "@/shared/custom-activity";
import { installChromeMock } from "@/test/chrome-mock";

vi.mock("@/background/managers/activity-manager", () => ({ broadcastActiveTab: vi.fn() }));
vi.mock("@/background/services/custom-assets-api", () => ({ deleteCustomAsset: vi.fn() }));

const backend = vi.hoisted(() => ({ api: "https://api.nowly.me" }));

export { backend };

vi.mock("@/background/services/api-state", () => ({
  getEffectiveApiUrl: () => backend.api,
  getEffectiveWebUrl: () => "https://nowly.me"
}));

export const id = "8b3f2e7c-5a0d-4c1e-9f6b-2d7a1c3e4f50";
export const publicId = "a".repeat(32);
export const key = `owner:${id}`;
export const account = {
  token: "nxt_fixture",
  user: {
    id: "owner",
    name: "Owner",
    image: null,
    discordId: "same-discord"
  },
  scopes: ["creator"] as "creator"[],
  expiresAt: Date.now() + 60000,
  connectedAt: 1
};
export const activity = {
  ...emptyCustomActivityDraft(() => 0),
  id,
  name: "Saved activity",
  createdAt: 1,
  updatedAt: 1
};

export const absent = () => Response.json({ error: "NOT_FOUND" }, { status: 404 });

export const blocked = {
  ok: false,
  error: "PUBLICATION_CHECK_REQUIRED"
};

export const fixtureFetch = async (_url: unknown, init?: RequestInit) => {
  if (init?.method === "POST") return Response.json({
    id: publicId,
    revision: 0,
    published: false
  });

  return Response.json({
    id: publicId,
    revision: 1
  });
};

export const setupRecovery = async () => {
  const storage = installChromeMock();
  backend.api = "https://api.nowly.me";
  await setAccount(account);
  await setCustomActivities({
    items: [activity],
    activeId: id,
    activatedAt: 1
  });
  vi.stubGlobal("fetch", vi.fn(fixtureFetch));
  return storage;
};
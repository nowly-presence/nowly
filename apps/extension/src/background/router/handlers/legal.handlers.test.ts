import { beforeEach, describe, expect, it, vi } from "vitest";
import { emptyLegalState } from "@nowly/shared/legal";
import { handleCheckLegalDocuments } from "@/background/router/handlers/legal.handlers";

const mocks = vi.hoisted(() => ({
  check: vi.fn(),
  broadcast: vi.fn()
}));

vi.mock("@/background/services/legal-documents", () => ({
  acceptLegalDocuments: vi.fn(),
  checkLegalDocuments: mocks.check,
  getLegalState: vi.fn()
}));
vi.mock("@/background/managers/activity-manager", () => ({ broadcastActiveTab: mocks.broadcast }));

const sender = {} as chrome.runtime.MessageSender;

describe("legal handlers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.check.mockResolvedValue(emptyLegalState());
    mocks.broadcast.mockResolvedValue(undefined);
  });

  it("forwards a forced check from the side panel", async () => {
    await handleCheckLegalDocuments({ force: true }, sender);
    await handleCheckLegalDocuments(undefined, sender);

    expect(mocks.check.mock.calls).toEqual([
      [{ force: true }],
      [{ force: false }]
    ]);
  });

  it("still answers with the checked state when broadcasting the active tab fails", async () => {
    mocks.broadcast.mockRejectedValue(new Error("no tab"));

    await expect(handleCheckLegalDocuments(undefined, sender)).resolves.toEqual(emptyLegalState());
  });
});